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

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const newWorkflow = new Workflow({
      ...workflowData,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newWorkflow.save()

    const createdWorkflow = await Workflow.findById(newWorkflow._id)
      .populate("steps.roleId", "name displayName")
      .populate("steps.departmentId", "name")
      .populate("steps.approverId", "name email")
      .populate("createdBy", "name email")
      .lean()

    await createAuditLog({
      userId,
      action: "create",
      resourceType: "Workflow",
      resourceId: newWorkflow._id.toString(),
      newData: createdWorkflow,
      description: `Tạo luồng phê duyệt mới: ${newWorkflow.name}`,
      request,
    })

    return NextResponse.json(createdWorkflow, { status: 201 })
  } catch (error) {
    console.error("Create workflow error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi tạo luồng phê duyệt." }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("searchTerm")
    const status = searchParams.get("status")

    const query: any = {}
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ]
    }
    if (status && status !== "all") {
      query.status = status
    }

    const workflows = await Workflow.find(query)
      .populate("steps.roleId", "name displayName")
      .populate("steps.departmentId", "name")
      .populate("steps.approverId", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(workflows)
  } catch (error) {
    console.error("Get workflows error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy danh sách luồng phê duyệt." }, { status: 500 })
  }
}