import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { FormSubmission } from "@/models/FormSubmission"
import { FormTemplate } from "@/models/FormTemplate"
import { User } from "@/models/User"
import { Workflow } from "@/models/Workflow"
import { Role } from "@/models/Role"
import { getUserIdFromToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { createNotification } from "@/lib/notification"
import mongoose from "mongoose"
import { sendFormSubmissionNotification } from "@/lib/mailer"
import type { FormField } from "@/types"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Không được phép truy cập" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const formTemplateId = searchParams.get("formTemplateId")
    const submitterId = searchParams.get("submitterId")
    const priority = searchParams.get("priority")
    const isApprovalRequired = searchParams.get("isApprovalRequired") === "true"
    const currentUserRoleId = searchParams.get("currentUserRoleId")
    const currentUserId = searchParams.get("currentUserId")

    const query: any = {}
    if (status && status !== "all") {
      query.status = status
    }
    if (formTemplateId && mongoose.Types.ObjectId.isValid(formTemplateId)) {
      query.formTemplateId = new mongoose.Types.ObjectId(formTemplateId)
    }
    if (submitterId && mongoose.Types.ObjectId.isValid(submitterId)) {
      query.submitterId = new mongoose.Types.ObjectId(submitterId)
    }
    if (priority && priority !== "all") {
      query.priority = priority
    }

    const user = await User.findById(userId).select("roleId").lean()
    if (!user || !user.roleId) {
      return NextResponse.json({ error: "Không tìm thấy thông tin vai trò người dùng" }, { status: 403 })
    }

    let submissions

    if (isApprovalRequired && currentUserRoleId && currentUserId) {
      const currentUser = await User.findById(currentUserId)
        .select("roleId")
        .populate("roleId", "name")
        .lean()
      if (!currentUser || !currentUser.roleId) {
        return NextResponse.json({ error: "Không tìm thấy thông tin vai trò người dùng" }, { status: 400 })
      }

      const workflows = await Workflow.find({ "steps.roleId": currentUser.roleId._id })
        .select("_id")
        .lean()
      const workflowIds = workflows.map((wf) => wf._id)

      submissions = await FormSubmission.find({
        status: "pending",
        formTemplateId: { $in: await FormTemplate.find({ workflowId: { $in: workflowIds } }).select("_id") },
      })
        .populate({
          path: "formTemplateId",
          select: "name description workflowId",
          populate: {
            path: "workflowId",
            select: "steps",
            populate: {
              path: "steps.roleId",
              model: Role,
              select: "displayName",
            },
          },
        })
        .populate("submitterId", "name email")
        .select("formTemplateId submitterId data status currentStep priority createdAt")
        .sort({ createdAt: -1 })
        .lean()

      submissions = submissions.filter((submission: any) => {
        if (!submission.formTemplateId || !submission.formTemplateId.workflowId) return false

        const currentWorkflow = submission.formTemplateId.workflowId
        const currentStepIndex = submission.currentStep
        const currentStep = currentWorkflow.steps[currentStepIndex]

        if (!currentStep) return false

        const isRoleMatch = currentStep.roleId && currentStep.roleId._id.equals(currentUser.roleId._id)
        const isSpecificApprover = currentStep.approverId && currentStep.approverId.equals(currentUser._id)

        return isRoleMatch || isSpecificApprover
      })
    } else {
      const workflows = await Workflow.find({ "steps.roleId": user.roleId })
        .select("_id")
        .lean()
      const workflowIds = workflows.map((wf) => wf._id)
      const formTemplateIds = await FormTemplate.find({ workflowId: { $in: workflowIds } })
        .select("_id")
        .lean()
      submissions = await FormSubmission.find({
        $or: [
          { submitterId: userId },
          { formTemplateId: { $in: formTemplateIds.map((t) => t._id) } },
        ],
        ...query,
      })
        .populate("formTemplateId", "name description")
        .populate("submitterId", "name email")
        .select("formTemplateId submitterId data status currentStep priority createdAt")
        .sort({ createdAt: -1 })
        .lean()
    }

    console.log("GET /api/submissions: Fetched", submissions.length, "submissions for user", userId)
    return NextResponse.json(submissions)
  } catch (error: any) {
    console.error("GET /api/submissions error:", error.message, error.stack)
    return NextResponse.json({ error: "Lỗi khi lấy danh sách đơn gửi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Không được phép truy cập" }, { status: 401 })
    }

    const submissionData = await request.json()
    console.log("Submission data:", submissionData)

    if (!submissionData.formTemplateId || !mongoose.Types.ObjectId.isValid(submissionData.formTemplateId)) {
      return NextResponse.json({ error: "ID biểu mẫu không hợp lệ" }, { status: 400 })
    }
    if (!submissionData.data || typeof submissionData.data !== "object") {
      return NextResponse.json({ error: "Dữ liệu biểu mẫu không hợp lệ" }, { status: 400 })
    }

    const formTemplate = await FormTemplate.findById(submissionData.formTemplateId)
      .populate("workflowId")
      .lean()
    if (!formTemplate) {
      return NextResponse.json({ error: "Biểu mẫu không tồn tại" }, { status: 404 })
    }
    if (!formTemplate.workflowId) {
      return NextResponse.json({ error: "Biểu mẫu không có luồng phê duyệt" }, { status: 400 })
    }
    if (formTemplate.workflowId.steps.length === 0) {
      return NextResponse.json({ error: "Luồng phê duyệt không có bước nào" }, { status: 400 })
    }

    // Kiểm tra step._id
    for (const step of formTemplate.workflowId.steps) {
      if (!step._id || !mongoose.Types.ObjectId.isValid(step._id)) {
        console.error("Invalid step ID:", step)
        return NextResponse.json({ error: "ID bước trong luồng phê duyệt không hợp lệ" }, { status: 400 })
      }
    }

    // Lấy thông tin phòng ban của người gửi
    const submitter = await User.findById(userId).select("departmentId name email").lean()
    if (!submitter || !submitter.departmentId) {
      return NextResponse.json({ error: "Không tìm thấy phòng ban của người gửi" }, { status: 400 })
    }

    // Log schema và steps
    console.log("FormSubmission schema enum:", FormSubmission.schema.paths["workflowInstance.status"]?.options.enum || "Field not found")
    console.log("Workflow steps:", JSON.stringify(formTemplate.workflowId.steps, null, 2))

    // Kiểm tra dữ liệu gửi lên so với fields của formTemplate
    const errors: string[] = []
    formTemplate.fields.forEach((field: FormField) => {
      const value = submissionData.data[field.id]
      if (field.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field.label} là trường bắt buộc`)
      }
      if (field.type === "select" && value && field.options) {
        const validOptions = field.options.map((opt: any) =>
          typeof opt === "string" ? opt : opt.value
        )
        if (!validOptions.includes(value)) {
          errors.push(`Giá trị không hợp lệ cho ${field.label}`)
        }
      }
      if (field.type === "checkbox" && value && Array.isArray(value)) {
        const validOptions = field.options.map((opt: any) =>
          typeof opt === "string" ? opt : opt.value
        )
        if (!value.every((v: string) => validOptions.includes(v))) {
          errors.push(`Giá trị không hợp lệ cho ${field.label}`)
        }
      }
      if (field.type === "radio" && value && field.options) {
        const validOptions = field.options.map((opt: any) =>
          typeof opt === "string" ? opt : opt.value
        )
        if (!validOptions.includes(value)) {
          errors.push(`Giá trị không hợp lệ cho ${field.label}`)
        }
      }
      if (field.type === "number" && value !== undefined && isNaN(Number(value))) {
        errors.push(`${field.label} phải là một số hợp lệ`)
      }
      if (field.validation) {
        if (field.validation.minLength && value && value.length < field.validation.minLength) {
          errors.push(`${field.label} phải có ít nhất ${field.validation.minLength} ký tự`)
        }
        if (field.validation.maxLength && value && value.length > field.validation.maxLength) {
          errors.push(`${field.label} không được vượt quá ${field.validation.maxLength} ký tự`)
        }
        if (field.validation.pattern && value && !new RegExp(field.validation.pattern).test(value)) {
          errors.push(`${field.label} không đúng định dạng`)
        }
      }
    })

    if (errors.length > 0) {
      return NextResponse.json({ error: "Dữ liệu biểu mẫu không hợp lệ", details: errors }, { status: 400 })
    }

    // Tạo workflowInstance với approverId dựa trên phòng ban
    const workflowInstance = await Promise.all(
      formTemplate.workflowId.steps.map(async (step: any, index: number) => {
        console.log("Processing step:", step)
        let approverId = null

        // Nếu có approverId được chỉ định
        if (step.approverId) {
          approverId = step.approverId
        } else {
          // Nếu không có approverId, tìm người dùng thuộc phòng ban của submitter và có roleId tương ứng
          const usersInDepartment = await User.find({
            departmentId: submitter.departmentId,
            roleId: step.roleId,
            status: "active",
          })
            .select("_id")
            .lean()
          if (usersInDepartment.length > 0) {
            const randomIndex = Math.floor(Math.random() * usersInDepartment.length)
            approverId = usersInDepartment[randomIndex]._id
          } else {
            console.warn(`No users found in department ${submitter.departmentId} with role ${step.roleId} for step ${index}`)
          }
        }

        return {
          stepId: step._id,
          status: "pending",
          approverId: approverId ? new mongoose.Types.ObjectId(approverId) : null,
        }
      })
    )

    console.log("Workflow instance:", JSON.stringify(workflowInstance, null, 2))

    const newSubmission = new FormSubmission({
      formTemplateId: submissionData.formTemplateId,
      submitterId: userId,
      data: submissionData.data,
      status: "pending",
      currentStep: 0,
      priority: submissionData.priority || "medium",
      approvalHistory: [
        {
          stepId: "initial",
          approverId: userId,
          action: "submitted",
          comment: "Đơn gửi được tạo",
          timestamp: new Date(),
        },
      ],
      workflowInstance,
    })

    console.log("New submission before save:", JSON.stringify(newSubmission.toObject(), null, 2))
    await newSubmission.save()
    console.log("Submission saved successfully:", newSubmission._id)

    await FormTemplate.findByIdAndUpdate(submissionData.formTemplateId, { $inc: { usageCount: 1 } })

    // Gửi thông báo và email cho approver ở bước đầu tiên
    const firstStep = formTemplate.workflowId.steps[0]
    if (firstStep) {
      let approver = null
      if (firstStep.approverId) {
        approver = await User.findById(firstStep.approverId)
          .select("name email")
          .lean()
      } else {
        // Nếu không có approverId, chọn ngẫu nhiên từ người dùng trong phòng ban của submitter
        const usersInDepartment = await User.find({
          departmentId: submitter.departmentId,
          roleId: firstStep.roleId,
          status: "active",
        })
          .select("name email")
          .lean()
        if (usersInDepartment.length > 0) {
          const randomIndex = Math.floor(Math.random() * usersInDepartment.length)
          approver = usersInDepartment[randomIndex]
        }
      }

      if (approver) {
        await createNotification({
          userId: approver._id.toString(),
          type: "submission_pending",
          title: "Yêu cầu phê duyệt mới",
          message: `Bạn có yêu cầu phê duyệt biểu mẫu "${formTemplate.name}" từ ${submitter.name || "một người dùng"}`,
          read: false,
          relatedFormId: newSubmission._id.toString(),
        })

        // Gửi email thông báo cho approver
        try {
          await sendFormSubmissionNotification({
            submission: newSubmission.toObject(),
            formTemplate,
            recipients: [submitter, approver],
            status: "pending",
          })
        } catch (error: any) {
          console.error("Failed to send email notification:", error.message)
          // Không trả về lỗi để không làm gián đoạn quá trình gửi biểu mẫu
        }
      } else {
        console.warn("No approver found for first step")
      }
    }

    await createAuditLog({
      userId,
      action: "submit",
      resourceType: "FormSubmission",
      resourceId: newSubmission._id.toString(),
      newData: newSubmission.toObject(),
      description: `Gửi biểu mẫu: ${formTemplate.name}`,
      request,
    })

    console.log("POST /api/submissions: Created submission", newSubmission._id)
    return NextResponse.json(newSubmission, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/submissions error:", error.message, error.stack)
    return NextResponse.json({ error: "Lỗi khi gửi biểu mẫu", details: error.message }, { status: 500 })
  }
}