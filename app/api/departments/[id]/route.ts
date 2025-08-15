import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { getUserIdFromToken } from "@/lib/auth"
import { updateDepartment } from "@/lib/department"
import { Department } from "@/models/Department"
import { createAuditLog } from "@/lib/audit"
import mongoose from "mongoose"
import { User } from "@/models/User"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID phòng ban không hợp lệ" }, { status: 400 })
    }

    const department = await Department.findById(id)
      .populate("managerId", "name email")
      .populate("parentDepartmentId", "name")
      .lean()

    if (!department) {
      return NextResponse.json({ error: "Phòng ban không tìm thấy" }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("GET /api/departments/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy thông tin phòng ban" }, { status: 500 })
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
      return NextResponse.json({ error: "ID phòng ban không hợp lệ" }, { status: 400 })
    }

    const updates = await request.json()

    if (!updates.name || updates.name.trim().length < 2) {
      return NextResponse.json({ error: "Tên phòng ban phải có ít nhất 2 ký tự" }, { status: 400 })
    }

    if (updates.managerId && !mongoose.Types.ObjectId.isValid(updates.managerId)) {
      return NextResponse.json({ error: "ID trưởng phòng không hợp lệ" }, { status: 400 })
    }
    if (updates.parentDepartmentId && !mongoose.Types.ObjectId.isValid(updates.parentDepartmentId)) {
      return NextResponse.json({ error: "ID phòng ban cha không hợp lệ" }, { status: 400 })
    }

    const oldDepartment = await Department.findById(id).lean()
    if (!oldDepartment) {
      return NextResponse.json({ error: "Phòng ban không tìm thấy" }, { status: 404 })
    }

    const department = await updateDepartment(id, updates)

    if (!department) {
      return NextResponse.json({ error: "Phòng ban không tìm thấy để cập nhật" }, { status: 404 })
    }

    await createAuditLog({
      userId,
      action: "update",
      resourceType: "Department",
      resourceId: id,
      oldData: oldDepartment,
      newData: department,
      description: `Cập nhật phòng ban: ${department.name}`,
      request,
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error("PUT /api/departments/[id] error:", error)
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Tên phòng ban hoặc mã phòng ban đã tồn tại" }, { status: 400 })
    }
    return NextResponse.json({ error: "Có lỗi xảy ra khi cập nhật phòng ban" }, { status: 500 })
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
      return NextResponse.json({ error: "ID phòng ban không hợp lệ" }, { status: 400 })
    }

    const department = await Department.findById(id).lean()
    if (!department) {
      return NextResponse.json({ error: "Phòng ban không tìm thấy" }, { status: 404 })
    }

    const childDepartments = await Department.find({ parentDepartmentId: id }).lean()
    if (childDepartments.length > 0) {
      return NextResponse.json(
        { error: "Không thể xóa phòng ban có phòng ban con. Vui lòng xóa hoặc chuyển phòng ban con trước." },
        { status: 400 },
      )
    }

    const usersInDepartment = await User.find({ departmentId: id }).lean() // Changed to departmentId
    if (usersInDepartment.length > 0) {
      return NextResponse.json(
        { error: "Không thể xóa phòng ban đang có người dùng. Vui lòng chuyển người dùng sang phòng ban khác trước." },
        { status: 400 },
      )
    }

    await Department.findByIdAndDelete(id)

    await createAuditLog({
      userId,
      action: "delete",
      resourceType: "Department",
      resourceId: id,
      oldData: department,
      description: `Xóa phòng ban: ${department.name}`,
      request,
    })

    return NextResponse.json({ message: "Phòng ban đã được xóa thành công" })
  } catch (error) {
    console.error("DELETE /api/departments/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi xóa phòng ban" }, { status: 500 })
  }
}
