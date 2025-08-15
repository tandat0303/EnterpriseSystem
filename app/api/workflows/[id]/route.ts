import { type NextRequest, NextResponse } from "next/server"
import { Workflow } from "@/models/Workflow"
import { Role } from "@/models/Role"
import { User } from "@/models/User"
import { Department } from "@/models/Department"
import { FormTemplate } from "@/models/FormTemplate"
import { dbConnect } from "@/lib/mongodb"
import { getUserIdFromToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import mongoose from "mongoose"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID luồng phê duyệt không hợp lệ" }, { status: 400 })
    }

    const workflow = await Workflow.findById(id)
      .populate("steps.roleId", "name displayName")
      .populate("steps.departmentId", "name")
      .populate("steps.approverId", "name email")
      .populate("createdBy", "name email")
      .lean()

    if (!workflow) {
      return NextResponse.json({ error: "Luồng phê duyệt không tìm thấy." }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error("GET /api/workflows/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy thông tin luồng phê duyệt." }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID luồng phê duyệt không hợp lệ" }, { status: 400 })
    }

    const workflowData = await request.json()

    if (!workflowData.name || workflowData.name.trim().length < 3) {
      return NextResponse.json({ error: "Tên luồng phê duyệt phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (!workflowData.description || workflowData.description.trim().length < 10) {
      return NextResponse.json({ error: "Mô tả luồng phê duyệt phải có ít nhất 10 ký tự." }, { status: 400 })
    }
    if (!workflowData.steps || !Array.isArray(workflowData.steps) || workflowData.steps.length === 0) {
      return NextResponse.json({ error: "Luồng phê duyệt phải có ít nhất một bước." }, { status: 400 })
    }

    for (const step of workflowData.steps) {
      if (!step.roleId || !mongoose.Types.ObjectId.isValid(step.roleId)) {
        return NextResponse.json({ error: `Bước phê duyệt có vai trò không hợp lệ: ${step.roleId}.` }, { status: 400 })
      }
      const role = await Role.findById(step.roleId)
      if (!role) {
        return NextResponse.json({ error: `Vai trò với ID ${step.roleId} không tồn tại.` }, { status: 400 })
      }
      if (step.departmentId && !mongoose.Types.ObjectId.isValid(step.departmentId)) {
        return NextResponse.json({ error: `Phòng ban không hợp lệ: ${step.departmentId}.` }, { status: 400 })
      }
      if (step.departmentId) {
        const department = await Department.findById(step.departmentId).populate("managerId", "name email")
        if (!department) {
          return NextResponse.json({ error: `Phòng ban với ID ${step.departmentId} không tồn tại.` }, { status: 400 })
        }
        if (role.name === "Trưởng phòng" && !department.managerId) {
          return NextResponse.json({ error: `Phòng ban ${department.name} chưa có trưởng phòng.` }, { status: 400 })
        }
        if (role.name === "Trưởng phòng") {
          step.approverId = department.managerId?._id
        }
      }
      if (role.name === "Trưởng phòng" && !step.departmentId) {
        return NextResponse.json({ error: `Bước ${step.order}: Vai trò Trưởng phòng yêu cầu chọn phòng ban.` }, { status: 400 })
      }
    }

    const oldWorkflow = await Workflow.findById(id).lean()

    const updatedWorkflow = await Workflow.findByIdAndUpdate(id, workflowData, { new: true })
      .populate("steps.roleId", "name displayName")
      .populate("steps.departmentId", "name")
      .populate("steps.approverId", "name email")
      .populate("createdBy", "name email")
      .lean()

    if (!updatedWorkflow) {
      return NextResponse.json({ error: "Luồng phê duyệt không tìm thấy để cập nhật." }, { status: 404 })
    }

    await createAuditLog({
      userId,
      action: "update",
      resourceType: "Workflow",
      resourceId: id,
      oldData: oldWorkflow,
      newData: updatedWorkflow,
      description: `Cập nhật luồng phê duyệt: ${updatedWorkflow.name}`,
      request,
    })

    return NextResponse.json(updatedWorkflow)
  } catch (error) {
    console.error("Update workflow error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi cập nhật luồng phê duyệt." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID luồng phê duyệt không hợp lệ" }, { status: 400 })
    }

    const workflowToDelete = await Workflow.findById(id).lean()
    if (!workflowToDelete) {
      return NextResponse.json({ error: "Luồng phê duyệt không tìm thấy để xóa." }, { status: 404 })
    }

    const formsUsingWorkflow = await FormTemplate.find({ workflowId: id }).lean()
    if (formsUsingWorkflow.length > 0) {
      return NextResponse.json(
        { error: "Không thể xóa luồng phê duyệt đang được sử dụng bởi biểu mẫu. Vui lòng cập nhật biểu mẫu trước." },
        { status: 400 },
      )
    }

    await Workflow.findByIdAndDelete(id)

    await createAuditLog({
      userId,
      action: "delete",
      resourceType: "Workflow",
      resourceId: id,
      oldData: workflowToDelete,
      description: `Xóa luồng phê duyệt: ${workflowToDelete.name}`,
      request,
    })

    return NextResponse.json({ message: "Luồng phê duyệt đã được xóa thành công." })
  } catch (error) {
    console.error("Delete workflow error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi xóa luồng phê duyệt." }, { status: 500 })
  }
}