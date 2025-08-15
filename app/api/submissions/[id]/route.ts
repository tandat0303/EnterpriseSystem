import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { FormSubmission } from "@/models/FormSubmission"
import { FormTemplate } from "@/models/FormTemplate"
import { Role } from "@/models/Role"
import { User } from "@/models/User"
import { Department } from "@/models/Department"
import { getUserIdFromToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import mongoose from "mongoose"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Không được phép truy cập" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID đơn gửi không hợp lệ" }, { status: 400 })
    }

    const submission = await FormSubmission.findById(id)
      .populate({
        path: "formTemplateId",
        select: "name description fields workflowId",
        populate: {
          path: "workflowId",
          select: "steps name",
          populate: [
            { path: "steps.roleId", model: Role, select: "displayName" },
            { path: "steps.approverId", model: User, select: "name email" },
            { path: "steps.departmentId", model: Department, select: "name" },
          ],
        },
      })
      .populate({
        path: "submitterId",
        select: "name email departmentId",
        populate: {
          path: "departmentId",
          model: Department,
          select: "name",
        },
      })
      .populate({
        path: "approvalHistory.approverId",
        select: "name email",
      })
      .select("formTemplateId submitterId data status currentStep priority approvalHistory workflowInstance createdAt")
      .lean()

    if (!submission) {
      return NextResponse.json({ error: "Đơn gửi không tìm thấy" }, { status: 404 })
    }

    // Log dữ liệu để debug
    console.log("Submission data:", {
      submissionId: id,
      formTemplateId: submission.formTemplateId?._id,
      workflowId: submission.formTemplateId?.workflowId?._id,
      workflowName: submission.formTemplateId?.workflowId?.name,
      fields: submission.formTemplateId?.fields,
      submitterId: submission.submitterId?._id,
      submitterDepartment: submission.submitterId?.departmentId,
      steps: submission.formTemplateId?.workflowId?.steps,
    })

    // Kiểm tra quyền: Chỉ submitter hoặc approver được xem
    const user = await User.findById(userId).populate("departmentId").select("roleId departmentId").lean()
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 403 })
    }

    if (!submission.formTemplateId || !submission.formTemplateId.workflowId) {
      return NextResponse.json({ error: "Không tìm thấy luồng phê duyệt" }, { status: 400 })
    }

    const isSubmitter = submission.submitterId._id.toString() === userId.toString()
    const isApprover = submission.formTemplateId.workflowId.steps.some((step: any) =>
      step.roleId._id.toString() === user.roleId.toString() ||
      (step.approverId && (step.approverId._id ? step.approverId._id.toString() : step.approverId.toString()) === userId.toString())
    )
    if (!isSubmitter && !isApprover) {
      return NextResponse.json({ error: "Bạn không có quyền xem đơn gửi này" }, { status: 403 })
    }

    console.log("GET /api/submissions/[id]: Fetched submission", id, "for user", userId, "user data:", user)
    return NextResponse.json(submission)
  } catch (error: any) {
    console.error("GET /api/submissions/[id] error:", error.message, error.stack)
    return NextResponse.json({ error: "Lỗi khi lấy thông tin đơn gửi: " + error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Không được phép truy cập" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID đơn gửi không hợp lệ" }, { status: 400 })
    }

    const submissionToDelete = await FormSubmission.findById(id)
      .populate({
        path: "formTemplateId",
        select: "workflowId",
        populate: {
          path: "workflowId",
          select: "steps name",
          populate: [
            { path: "steps.roleId", model: Role, select: "displayName" },
            { path: "steps.approverId", model: User, select: "name email" },
            { path: "steps.departmentId", model: Department, select: "name" },
          ],
        },
      })
      .lean()
    if (!submissionToDelete) {
      return NextResponse.json({ error: "Đơn gửi không tìm thấy" }, { status: 404 })
    }

    // Kiểm tra quyền: Chỉ submitter hoặc approver được xóa
    const user = await User.findById(userId).populate("departmentId").select("roleId").lean()
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 403 })
    }

    if (!submissionToDelete.formTemplateId || !submissionToDelete.formTemplateId.workflowId) {
      return NextResponse.json({ error: "Không tìm thấy luồng phê duyệt" }, { status: 400 })
    }

    const isSubmitter = submissionToDelete.submitterId.toString() === userId.toString()
    const isApprover = submissionToDelete.formTemplateId.workflowId.steps.some((step: any) =>
      step.roleId.toString() === user.roleId.toString() ||
      (step.approverId && (step.approverId._id ? step.approverId._id.toString() : step.approverId.toString()) === userId.toString())
    )
    if (!isSubmitter && !isApprover) {
      return NextResponse.json({ error: "Bạn không có quyền xóa đơn gửi này" }, { status: 403 })
    }

    // Chỉ cho phép xóa nếu submission ở trạng thái draft hoặc rejected
    if (submissionToDelete.status !== "draft" && submissionToDelete.status !== "rejected") {
      return NextResponse.json({ error: "Chỉ có thể xóa đơn gửi ở trạng thái nháp hoặc đã bị từ chối" }, { status: 403 })
    }

    if (submissionToDelete.formTemplateId) {
      await FormTemplate.findByIdAndUpdate(submissionToDelete.formTemplateId, { $inc: { usageCount: -1 } })
    }

    await FormSubmission.findByIdAndDelete(id)

    await createAuditLog({
      userId,
      action: "delete",
      resourceType: "FormSubmission",
      resourceId: id,
      oldData: submissionToDelete,
      description: `Xóa đơn gửi: ${submissionToDelete.formTemplateId?.toString() || "unknown"}`,
      request,
    })

    console.log("DELETE /api/submissions/[id]: Deleted submission", id, "by user", userId)
    return NextResponse.json({ message: "Đơn gửi đã được xóa thành công" })
  } catch (error: any) {
    console.error("DELETE /api/submissions/[id] error:", error.message, error.stack)
    return NextResponse.json({ error: "Lỗi khi xóa đơn gửi: " + error.message }, { status: 500 })
  }
}