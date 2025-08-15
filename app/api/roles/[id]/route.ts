import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Role } from "@/models/Role"
import { Permission } from "@/models/Permission"
import { User } from "@/models/User"
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
      return NextResponse.json({ error: "ID vai trò không hợp lệ" }, { status: 400 })
    }

    const role = await Role.findById(id)
      .populate("permissions", "name displayName category")
      .populate("createdBy", "name email")
      .lean()

    if (!role) {
      return NextResponse.json({ error: "Vai trò không tìm thấy." }, { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error("GET /api/roles/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy thông tin vai trò." }, { status: 500 })
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
      return NextResponse.json({ error: "ID vai trò không hợp lệ" }, { status: 400 })
    }

    const updates = await request.json()

    if (!updates.name || updates.name.trim().length < 3) {
      return NextResponse.json({ error: "Tên vai trò phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (!updates.displayName || updates.displayName.trim().length < 3) {
      return NextResponse.json({ error: "Tên hiển thị vai trò phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (updates.level === undefined || updates.level < 1 || updates.level > 100) {
      return NextResponse.json({ error: "Cấp độ vai trò phải từ 1 đến 100." }, { status: 400 })
    }

    const existingRoleWithName = await Role.findOne({ name: updates.name, _id: { $ne: id } })
    if (existingRoleWithName) {
      return NextResponse.json({ error: "Tên vai trò đã được sử dụng bởi vai trò khác." }, { status: 400 })
    }

    if (updates.permissions && Array.isArray(updates.permissions)) {
      for (const permId of updates.permissions) {
        if (!mongoose.Types.ObjectId.isValid(permId)) {
          return NextResponse.json({ error: `ID quyền hạn không hợp lệ: ${permId}` }, { status: 400 })
        }
        const exists = await Permission.findById(permId)
        if (!exists) {
          return NextResponse.json({ error: `Quyền hạn với ID ${permId} không tồn tại.` }, { status: 400 })
        }
      }
    } else {
      updates.permissions = []
    }

    const oldRole = await Role.findById(id).lean()

    const updatedRole = await Role.findByIdAndUpdate(id, updates, { new: true })
      .populate("permissions", "name displayName category")
      .populate("createdBy", "name email")
      .lean()

    if (!updatedRole) {
      return NextResponse.json({ error: "Vai trò không tìm thấy để cập nhật." }, { status: 404 })
    }

    await createAuditLog({
      userId,
      action: "update",
      resourceType: "Role",
      resourceId: id,
      oldData: oldRole,
      newData: updatedRole,
      description: `Cập nhật vai trò: ${updatedRole.displayName}`,
      request,
    })

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error("PUT /api/roles/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi cập nhật vai trò." }, { status: 500 })
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
      return NextResponse.json({ error: "ID vai trò không hợp lệ" }, { status: 400 })
    }

    const roleToDelete = await Role.findById(id).lean()
    if (!roleToDelete) {
      return NextResponse.json({ error: "Vai trò không tìm thấy để xóa." }, { status: 404 })
    }

    if (roleToDelete.isSystem) {
      return NextResponse.json({ error: "Không thể xóa vai trò hệ thống." }, { status: 403 })
    }

    const usersWithRole = await User.find({ roleId: id }).lean()
    if (usersWithRole.length > 0) {
      return NextResponse.json(
        {
          error:
            "Không thể xóa vai trò đang được sử dụng bởi người dùng. Vui lòng chuyển người dùng sang vai trò khác trước.",
        },
        { status: 400 },
      )
    }

    await Role.findByIdAndDelete(id)

    await createAuditLog({
      userId,
      action: "delete",
      resourceType: "Role",
      resourceId: id,
      oldData: roleToDelete,
      description: `Xóa vai trò: ${roleToDelete.displayName}`,
      request,
    })

    return NextResponse.json({ message: "Vai trò đã được xóa thành công." })
  } catch (error) {
    console.error("DELETE /api/roles/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi xóa vai trò." }, { status: 500 })
  }
}
