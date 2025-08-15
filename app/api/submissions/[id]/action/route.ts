import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { FormSubmission } from "@/models/FormSubmission"
import { User } from "@/models/User"
import { Role } from "@/models/Role"
import { FormTemplate } from "@/models/FormTemplate"
import { getUserIdFromToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { createNotification } from "@/lib/notification"
import { sendFormSubmissionNotification } from "@/lib/mailer"
import mongoose from "mongoose"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const approverId = await getUserIdFromToken(request)
    if (!approverId) {
      return NextResponse.json({ error: "Không được phép truy cập" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID đơn gửi không hợp lệ" }, { status: 400 })
    }

    const { action, comment } = await request.json()

    if (!["approve", "reject", "feedback"].includes(action)) {
      return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 })
    }

    if (action === "feedback" && (!comment || comment.trim().length === 0)) {
      return NextResponse.json({ error: "Phản hồi phải có bình luận" }, { status: 400 })
    }

    const submission = await FormSubmission.findById(id)
      .populate({
        path: "formTemplateId",
        select: "name description workflowId",
        populate: {
          path: "workflowId",
          select: "steps",
          populate: [
            { path: "steps.roleId", model: Role, select: "displayName" },
            { path: "steps.approverId", model: User, select: "_id name email" },
          ],
        },
      })
      .populate("submitterId", "name email")
      .lean()

    if (!submission) {
      return NextResponse.json({ error: "Đơn gửi không tìm thấy" }, { status: 404 })
    }

    const formTemplate = submission.formTemplateId as any
    const workflow = formTemplate.workflowId as any

    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
      return NextResponse.json({ error: "Luồng phê duyệt không hợp lệ hoặc không có bước nào" }, { status: 400 })
    }

    const currentStepIndex = submission.currentStep
    const currentStep = workflow.steps[currentStepIndex]

    if (!currentStep) {
      return NextResponse.json({ error: "Không tìm thấy bước phê duyệt hiện tại" }, { status: 400 })
    }

    const currentUser = await User.findById(approverId).select("roleId name email").populate("roleId", "name").lean()
    if (!currentUser || !currentUser.roleId) {
      return NextResponse.json({ error: "Không tìm thấy thông tin vai trò người dùng hiện tại" }, { status: 403 })
    }

    const isRoleMatch = currentStep.roleId && currentStep.roleId._id.equals(currentUser.roleId._id)
    const isSpecificApprover = currentStep.approverId && currentStep.approverId._id.equals(currentUser._id)

    if (!isRoleMatch && !isSpecificApprover) {
      return NextResponse.json({ error: "Bạn không có quyền phê duyệt bước này" }, { status: 403 })
    }

    const oldSubmission = { ...submission }

    // Khởi tạo workflowInstance nếu chưa có
    const updateFields: any = {
      $push: {
        approvalHistory: {
          stepId: currentStep.order.toString(),
          approverId: approverId,
          action: action,
          comment: comment || undefined,
          timestamp: new Date(),
        },
      },
    }

    // Đảm bảo workflowInstance là mảng nếu chưa tồn tại
    if (!submission.workflowInstance || !Array.isArray(submission.workflowInstance)) {
      updateFields.$set = { workflowInstance: Array(workflow.steps.length).fill({}) }
    }

    updateFields.$set = {
      ...updateFields.$set,
      [`workflowInstance.${currentStepIndex}.status`]:
        action === "approve" ? "approved" : action === "reject" ? "rejected" : "feedback",
      [`workflowInstance.${currentStepIndex}.approverId`]: approverId,
      [`workflowInstance.${currentStepIndex}.approvedAt`]: new Date(),
      [`workflowInstance.${currentStepIndex}.comments`]: comment || undefined,
    }

    let notificationMessage = ""
    let notificationType: "submission_approved" | "submission_rejected" | "submission_pending" = "submission_pending"
    let emailStatus: string = action === "feedback" ? "responded" : action

    if (action === "approve") {
      if (currentStepIndex === workflow.steps.length - 1) {
        updateFields.$set.status = "approved"
        updateFields.$set.currentStep = currentStepIndex // Giữ currentStep để tránh tăng khi là bước cuối
        notificationType = "submission_approved"
        notificationMessage = `Biểu mẫu "${formTemplate.name}" của bạn đã được phê duyệt hoàn toàn`
      } else {
        updateFields.$set.currentStep = currentStepIndex + 1
        updateFields.$set.status = "pending"
        notificationType = "submission_pending"
        notificationMessage = `Biểu mẫu "${formTemplate.name}" của bạn đã được phê duyệt bước ${currentStepIndex + 1}. Yêu cầu phê duyệt tiếp theo`
      }
    } else if (action === "reject") {
      updateFields.$set.status = "rejected"
      updateFields.$set.currentStep = currentStepIndex // Giữ currentStep khi từ chối
      notificationType = "submission_rejected"
      notificationMessage = `Biểu mẫu "${formTemplate.name}" của bạn đã bị từ chối. Lý do: ${comment || "Không có"}`
    } else if (action === "feedback") {
      updateFields.$set.status = "feedback_requested"
      updateFields.$set.currentStep = currentStepIndex // Giữ currentStep khi phản hồi
      notificationType = "submission_pending"
      notificationMessage = `Biểu mẫu "${formTemplate.name}" của bạn cần phản hồi. Lý do: ${comment}`
    }

    const updatedSubmission = await FormSubmission.findByIdAndUpdate(id, updateFields, { new: true })
      .populate({
        path: "formTemplateId",
        select: "name description fields workflowId",
        populate: {
          path: "workflowId",
          select: "steps",
          populate: [
            { path: "steps.roleId", model: Role, select: "displayName" },
            { path: "steps.approverId", model: User, select: "_id name email" },
          ],
        },
      })
      .populate("submitterId", "name email")
      .populate({
        path: "approvalHistory.approverId",
        select: "name email",
      })
      .select("formTemplateId submitterId data status currentStep priority approvalHistory workflowInstance createdAt")
      .lean()

    if (!updatedSubmission) {
      return NextResponse.json({ error: "Không thể cập nhật đơn gửi" }, { status: 500 })
    }

    // Xây dựng danh sách recipients cho email
    const recipients = [submission.submitterId, currentUser] // Bao gồm submitter và approver hiện tại
    if (action === "approve" && updatedSubmission.status === "pending") {
      const nextStep = workflow.steps[updatedSubmission.currentStep]
      if (nextStep) {
        let nextApprovers
        if (nextStep.approverId) {
          nextApprovers = await User.find({ _id: nextStep.approverId, status: "active" })
            .select("name email")
            .lean()
        } else {
          const nextApproverRole = await Role.findById(nextStep.roleId).select("name").lean()
          if (nextApproverRole) {
            nextApprovers = await User.find({ roleId: nextApproverRole._id, status: "active" })
              .select("name email")
              .lean()
          }
        }
        if (nextApprovers) {
          recipients.push(...nextApprovers)
        }
      }
    }

    // Gửi email thông báo
    try {
      await sendFormSubmissionNotification({
        submission: updatedSubmission,
        formTemplate,
        recipients,
        status: emailStatus,
      })
    } catch (error: any) {
      console.error("Failed to send email notification:", error.message)
      // Không trả về lỗi để không làm gián đoạn quá trình cập nhật
    }

    await createNotification({
      userId: submission.submitterId._id.toString(),
      type: notificationType,
      title:
        notificationType === "submission_approved"
          ? "Biểu mẫu đã được phê duyệt"
          : notificationType === "submission_rejected"
            ? "Biểu mẫu đã bị từ chối"
            : "Yêu cầu phản hồi hoặc phê duyệt tiếp theo",
      message: notificationMessage,
      read: false,
      relatedFormId: updatedSubmission._id.toString(),
    })

    if (action === "approve" && updatedSubmission.status === "pending") {
      const nextStep = workflow.steps[updatedSubmission.currentStep]
      if (nextStep) {
        const nextApproverRole = await Role.findById(nextStep.roleId).select("name").lean()
        if (nextApproverRole) {
          let usersWithNextRole
          if (nextStep.approverId) {
            usersWithNextRole = await User.find({ _id: nextStep.approverId, status: "active" })
              .select("name email")
              .lean()
          } else {
            usersWithNextRole = await User.find({ roleId: nextApproverRole._id, status: "active" })
              .select("name email")
              .lean()
          }
          for (const user of usersWithNextRole) {
            await createNotification({
              userId: user._id.toString(),
              type: "submission_pending",
              title: "Yêu cầu phê duyệt mới",
              message: `Bạn có yêu cầu phê duyệt biểu mẫu "${formTemplate.name}" từ ${(submission.submitterId as any)?.name || "một người dùng"}`,
              read: false,
              relatedFormId: updatedSubmission._id.toString(),
            })
          }
        }
      }
    }

    await createAuditLog({
      userId: approverId,
      action: action,
      resourceType: "FormSubmission",
      resourceId: id,
      oldData: oldSubmission,
      newData: updatedSubmission,
      description: `${action === "approve" ? "Phê duyệt" : action === "reject" ? "Từ chối" : "Yêu cầu phản hồi"} biểu mẫu: ${formTemplate.name}`,
      request,
    })

    console.log("POST /api/submissions/[id]/action: Performed", action, "on submission", id, "by user", approverId)
    return NextResponse.json(updatedSubmission)
  } catch (error: any) {
    console.error("POST /api/submissions/[id]/action error:", error.message, error.stack)
    return NextResponse.json({ error: "Lỗi khi thực hiện hành động", details: error.message }, { status: 500 })
  }
}