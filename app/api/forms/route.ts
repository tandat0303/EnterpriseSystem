import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { FormTemplate } from "@/models/FormTemplate"
import { Workflow } from "@/models/Workflow"
import { Department } from "@/models/Department"
import { getUserIdFromToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("searchTerm")
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    const query: any = {}
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ]
    }
    if (category && category !== "all") {
      query.category = category
    }
    if (status && status !== "all") {
      query.status = status
    }

    const forms = await FormTemplate.find(query)
      .populate("workflowId", "name description")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(forms)
  } catch (error) {
    console.error("GET /api/forms error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy danh sách biểu mẫu." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.json()

    if (!formData.name || formData.name.trim().length < 3) {
      return NextResponse.json({ error: "Tên biểu mẫu phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (!formData.workflowId || !mongoose.Types.ObjectId.isValid(formData.workflowId)) {
      return NextResponse.json({ error: "ID luồng phê duyệt không hợp lệ." }, { status: 400 })
    }
    if (!formData.category) {
      return NextResponse.json({ error: "Danh mục không được để trống." }, { status: 400 })
    }

    // Kiểm tra category có khớp với Department.name
    const department = await Department.findOne({ name: formData.category, status: "active" }).lean()
    if (!department) {
      return NextResponse.json({ error: "Danh mục không hợp lệ. Vui lòng chọn một phòng ban hợp lệ." }, { status: 400 })
    }

    const workflowExists = await Workflow.findById(formData.workflowId)
    if (!workflowExists) {
      return NextResponse.json({ error: "Luồng phê duyệt được chọn không tồn tại." }, { status: 400 })
    }

    const newForm = new FormTemplate({
      ...formData,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newForm.save()

    const createdForm = await FormTemplate.findById(newForm._id)
      .populate("workflowId", "name description")
      .populate("createdBy", "name email")
      .lean()

    await createAuditLog({
      userId,
      action: "create",
      resourceType: "FormTemplate",
      resourceId: newForm._id.toString(),
      newData: createdForm,
      description: `Tạo biểu mẫu mới: ${newForm.name}`,
      request,
    })

    return NextResponse.json(createdForm, { status: 201 })
  } catch (error: any) {
    console.error("Create form error:", error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: `Tên biểu mẫu "${formData.name}" đã tồn tại. Vui lòng chọn tên khác.`, code: 11000 },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Có lỗi xảy ra khi tạo biểu mẫu." }, { status: 500 })
  }
}