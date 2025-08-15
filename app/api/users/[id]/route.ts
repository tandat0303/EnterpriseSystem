import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { User } from "@/models/User"
import { Department } from "@/models/Department"
import { Role } from "@/models/Role"
import { Permission } from "@/models/Permission"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"
import { createAuditLog } from "@/lib/audit"
import { getUserIdFromToken } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID người dùng không hợp lệ" }, { status: 400 })
    }

    const user = await User.findById(id)
      .select("-password")
      .populate({
        path: "roleId",
        model: Role,
        populate: {
          path: "permissions",
          model: Permission,
        },
      })
      .populate("departmentId", "name")
      .lean()

    if (!user) {
      return NextResponse.json({ error: "Người dùng không tìm thấy" }, { status: 404 })
    }

    const userPermissions: string[] = []
    if (user.roleId && user.roleId.permissions) {
      user.roleId.permissions.forEach((perm: any) => {
        if (perm.name) {
          userPermissions.push(perm.name)
        }
      })
    }

    const userResponse = {
      ...user,
      role: user.roleId ? user.roleId.displayName : null,
      department: user.departmentId ? user.departmentId.name : null,
      permissions: userPermissions,
    }

    return NextResponse.json(userResponse)
  } catch (error) {
    console.error("Get user by ID error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy thông tin người dùng" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const requestorId = await getUserIdFromToken(request)
    if (!requestorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const userData = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID người dùng không hợp lệ" }, { status: 400 })
    }

    if (!userData.name || userData.name.trim().length < 3) {
      return NextResponse.json({ error: "Tên người dùng phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 })
    }
    if (userData.password && userData.password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 })
    }
    if (!userData.roleId || !mongoose.Types.ObjectId.isValid(userData.roleId)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 })
    }
    if (!userData.departmentId || !mongoose.Types.ObjectId.isValid(userData.departmentId)) {
      return NextResponse.json({ error: "Phòng ban không hợp lệ." }, { status: 400 })
    }

    const role = await Role.findOne({ _id: userData.roleId, status: "active" })
    if (!role) {
      return NextResponse.json({ error: "Vai trò được chọn không tồn tại hoặc không hoạt động." }, { status: 400 })
    }

    const departmentExists = await Department.findOne({ _id: userData.departmentId, status: "active" })
    if (!departmentExists) {
      return NextResponse.json({ error: "Phòng ban được chọn không tồn tại hoặc không hoạt động." }, { status: 400 })
    }

    const existingUserWithEmail = await User.findOne({ email: userData.email, _id: { $ne: id } })
    if (existingUserWithEmail) {
      return NextResponse.json({ error: "Email đã được sử dụng bởi người dùng khác." }, { status: 400 })
    }

    const oldUser = await User.findById(id).select("-password").lean()

    const updateFields: any = {
      name: userData.name,
      email: userData.email,
      roleId: userData.roleId,
      departmentId: userData.departmentId,
      status: userData.status,
    }

    if (userData.password) {
      updateFields.password = await bcrypt.hash(userData.password, 12)
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateFields, { new: true })
      .select("-password")
      .populate("roleId", "name displayName level")
      .populate("departmentId", "name")
      .lean()

    if (!updatedUser) {
      return NextResponse.json({ error: "Người dùng không tìm thấy để cập nhật" }, { status: 404 })
    }

    await createAuditLog({
      userId: requestorId,
      action: "update",
      resourceType: "User",
      resourceId: id,
      oldData: oldUser,
      newData: updatedUser,
      description: `Cập nhật người dùng: ${updatedUser.email}`,
      request,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi cập nhật người dùng" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const requestorId = await getUserIdFromToken(request)
    if (!requestorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID người dùng không hợp lệ" }, { status: 400 })
    }

    const deletedUser = await User.findByIdAndDelete(id).lean()

    if (!deletedUser) {
      return NextResponse.json({ error: "Người dùng không tìm thấy để xóa" }, { status: 404 })
    }

    await createAuditLog({
      userId: requestorId,
      action: "delete",
      resourceType: "User",
      resourceId: id,
      oldData: deletedUser,
      description: `Xóa người dùng: ${deletedUser.email}`,
      request,
    })

    return NextResponse.json({ message: "Người dùng đã được xóa thành công" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi xóa người dùng" }, { status: 500 })
  }
}
