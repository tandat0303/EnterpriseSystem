import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { getUserIdFromToken } from "@/lib/auth"
import { Permission } from "@/models/Permission"
import { createAuditLog } from "@/lib/audit"
import mongoose from "mongoose"
import { Role } from "@/models/Role"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID quyền hạn không hợp lệ" }, { status: 400 })
    }

    const permission = await Permission.findById(id).lean()

    if (!permission) {
      return NextResponse.json({ error: "Quyền hạn không tìm thấy." }, { status: 404 })
    }

    return NextResponse.json(permission)
  } catch (error) {
    console.error("GET /api/permissions/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy thông tin quyền hạn." }, { status: 500 })
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
      return NextResponse.json({ error: "ID quyền hạn không hợp lệ" }, { status: 400 })
    }

    const updates = await request.json()

    if (!updates.name || !updates.displayName || !updates.category || !updates.resource || !updates.action) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 })
    }

    const existingPermissionWithName = await Permission.findOne({ name: updates.name, _id: { $ne: id } })
    if (existingPermissionWithName) {
      return NextResponse.json({ error: "Tên quyền hạn đã được sử dụng bởi quyền hạn khác." }, { status: 400 })
    }

    const oldPermission = await Permission.findById(id).lean()

    const updatedPermission = await Permission.findByIdAndUpdate(id, updates, { new: true }).lean()

    if (!updatedPermission) {
      return NextResponse.json({ error: "Quyền hạn không tìm thấy để cập nhật." }, { status: 404 })
    }

    await createAuditLog({
      userId,
      action: "update",
      resourceType: "Permission",
      resourceId: id,
      oldData: oldPermission,
      newData: updatedPermission,
      description: `Cập nhật quyền hạn: ${updatedPermission.displayName}`,
      request,
    })

    return NextResponse.json(updatedPermission)
  } catch (error) {
    console.error("PUT /api/permissions/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi cập nhật quyền hạn." }, { status: 500 })
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
      return NextResponse.json({ error: "ID quyền hạn không hợp lệ" }, { status: 400 })
    }

    const permissionToDelete = await Permission.findById(id).lean()
    if (!permissionToDelete) {
      return NextResponse.json({ error: "Quyền hạn không tìm thấy để xóa." }, { status: 404 })
    }

    if (permissionToDelete.isSystem) {
      return NextResponse.json({ error: "Không thể xóa quyền hạn hệ thống." }, { status: 403 })
    }

    const rolesUsingPermission = await Role.find({ permissions: id }).lean()
    if (rolesUsingPermission.length > 0) {
      return NextResponse.json(
        {
          error: "Không thể xóa quyền hạn đang được sử dụng bởi vai trò. Vui lòng gỡ quyền hạn khỏi các vai trò trước.",
        },
        { status: 400 },
      )
    }

    await Permission.findByIdAndDelete(id)

    await createAuditLog({
      userId,
      action: "delete",
      resourceType: "Permission",
      resourceId: id,
      oldData: permissionToDelete,
      description: `Xóa quyền hạn: ${permissionToDelete.displayName}`,
      request,
    })

    return NextResponse.json({ message: "Quyền hạn đã được xóa thành công." })
  } catch (error) {
    console.error("DELETE /api/permissions/[id] error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi xóa quyền hạn." }, { status: 500 })
  }
}
