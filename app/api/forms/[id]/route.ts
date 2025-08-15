import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { FormTemplate } from "@/models/FormTemplate"
import { Workflow } from "@/models/Workflow"
import { Department } from "@/models/Department"
import { getUserIdFromToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import mongoose from "mongoose"
import { FormSubmission } from "@/models/FormSubmission"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID biểu mẫu không hợp lệ" }, { status: 400 })
    }

    const form = await FormTemplate.findById(id)
      .populate({
        path: "workflowId",
        select: "name description steps",
        populate: [
          {
            path: "steps.roleId",
            select: "name displayName",
          },
          {
            path: "steps.approverId",
            select: "name email",
          },
        ],
      })
      .populate("createdBy", "name email")
      .lean()

    if (!form) {
      return NextResponse.json({ error: "Biểu mẫu không tìm thấy." }, { status: 404 })
    }

    return NextResponse.json(form)
  } catch (error: any) {
    console.error("GET /api/forms/[id] error:", error)
    return NextResponse.json(
      { error: error.message || "Có lỗi xảy ra khi lấy thông tin biểu mẫu." },
      { status: 500 }
    )
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
      return NextResponse.json({ error: "ID biểu mẫu không hợp lệ" }, { status: 400 })
    }

    const updates = await request.json()

    if (!updates.name || updates.name.trim().length < 3) {
      return NextResponse.json({ error: "Tên biểu mẫu phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (!updates.workflowId || !mongoose.Types.ObjectId.isValid(updates.workflowId)) {
      return NextResponse.json({ error: "ID luồng phê duyệt không hợp lệ." }, { status: 400 })
    }
    if (!updates.category) {
      return NextResponse.json({ error: "Danh mục không được để trống." }, { status: 400 })
    }
    if (!Array.isArray(updates.fields)) {
      return NextResponse.json({ error: "Danh sách trường dữ liệu không hợp lệ." }, { status: 400 })
    }

    // Kiểm tra category có khớp với Department.name
    const department = await Department.findOne({ name: updates.category, status: "active" }).lean()
    if (!department) {
      return NextResponse.json({ error: "Danh mục không hợp lệ. Vui lòng chọn một phòng ban hợp lệ." }, { status: 400 })
    }

    // Validate fields
    for (const field of updates.fields) {
      if (!field.label || field.label.trim().length === 0) {
        return NextResponse.json({ error: "Nhãn trường không được để trống." }, { status: 400 })
      }
      if (field.type === "select" && (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
        return NextResponse.json({ error: "Trường lựa chọn phải có ít nhất một tùy chọn." }, { status: 400 })
      }
    }

    // Check if workflow exists
    const workflowExists = await Workflow.findById(updates.workflowId)
    if (!workflowExists) {
      return NextResponse.json({ error: "Luồng phê duyệt được chọn không tồn tại." }, { status: 400 })
    }

    const oldForm = await FormTemplate.findById(id).lean()

    const updatedForm = await FormTemplate.findByIdAndUpdate(
      id,
      {
        ...updates,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate({
        path: "workflowId",
        select: "name description steps",
        populate: [
          {
            path: "steps.roleId",
            select: "name displayName",
          },
          {
            path: "steps.approverId",
            select: "name email",
          },
        ],
      })
      .populate("createdBy", "name email")
      .lean()

    if (!updatedForm) {
      return NextResponse.json({ error: "Biểu mẫu không tìm thấy để cập nhật." }, { status: 404 })
    }

    // Create audit log
    await createAuditLog({
      userId,
      action: "update",
      resourceType: "FormTemplate",
      resourceId: id,
      oldData: oldForm,
      newData: updatedForm,
      description: `Cập nhật biểu mẫu: ${updatedForm.name}`,
      request,
    })

    return NextResponse.json(updatedForm)
  } catch (error: any) {
    console.error("PUT /api/forms/[id] error:", error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: `Tên biểu mẫu "${updates.name}" đã tồn tại. Vui lòng chọn tên khác.`, code: 11000 },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Có lỗi xảy ra khi cập nhật biểu mẫu." },
      { status: 500 }
    )
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
      return NextResponse.json({ error: "ID biểu mẫu không hợp lệ" }, { status: 400 })
    }

    const formToDelete = await FormTemplate.findById(id).lean()
    if (!formToDelete) {
      return NextResponse.json({ error: "Biểu mẫu không tìm thấy để xóa." }, { status: 404 })
    }

    // Check if there are any submissions using this form
    const submissionsUsingForm = await FormSubmission.find({ formTemplateId: id }).lean()
    if (submissionsUsingForm.length > 0) {
      return NextResponse.json(
        { error: "Không thể xóa biểu mẫu đang có đơn gửi. Vui lòng xóa các đơn gửi liên quan trước." },
        { status: 400 }
      )
    }

    await FormTemplate.findByIdAndDelete(id)

    // Create audit log
    await createAuditLog({
      userId,
      action: "delete",
      resourceType: "FormTemplate",
      resourceId: id,
      oldData: formToDelete,
      description: `Xóa biểu mẫu: ${formToDelete.name}`,
      request,
    })

    return NextResponse.json({ message: "Biểu mẫu đã được xóa thành công." })
  } catch (error: any) {
    console.error("DELETE /api/forms/[id] error:", error)
    return NextResponse.json(
      { error: error.message || "Có lỗi xảy ra khi xóa biểu mẫu." },
      { status: 500 }
    )
  }
}