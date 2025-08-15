import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { dbConnect } from "@/lib/mongodb"
import { User } from "@/models/User"
import { Role } from "@/models/Role"
import { Permission } from "@/models/Permission"
import { Department } from "@/models/Department"
import { createAuditLog } from "@/lib/audit"

export const maxDuration = 30

export async function POST(request: Request) {
  await dbConnect()

  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 })
  }

  try {
    // Tìm người dùng và populate roleId và departmentId
    const user = await User.findOne({ email }).populate({
      path: "roleId",
      model: Role,
      populate: {
        path: "permissions",
        model: Permission,
      },
    }).populate({
      path: "departmentId",
      model: Department,
      select: "name" // Chỉ lấy trường name từ Department nếu cần
    })

    if (!user) {
      // Ghi log audit cho thất bại đăng nhập (email không tồn tại)
      await createAuditLog({
        userId: "anonymous", // Người dùng không xác định
        action: "login",
        resourceType: "User",
        resourceId: "unknown", // Không có ID người dùng cụ thể
        newData: { email, status: "failed_attempt" },
        description: `Đăng nhập thất bại cho email: ${email} (email không tồn tại)`,
        request: request as any,
      })
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      // Ghi log audit cho thất bại đăng nhập (mật khẩu sai)
      await createAuditLog({
        userId: user._id.toString(),
        action: "login",
        resourceType: "User",
        resourceId: user._id.toString(),
        newData: { email: user.email, status: "failed_attempt" },
        description: `Đăng nhập thất bại cho người dùng: ${user.email} (mật khẩu sai)`,
        request: request as any,
      })
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    // Cập nhật lastLogin
    user.lastLogin = new Date()
    await user.save()

    const userPermissions: string[] = []
    if (user.roleId && user.roleId.permissions) {
      user.roleId.permissions.forEach((perm: any) => {
        if (perm.name) {
          userPermissions.push(perm.name)
        }
      })
    }

    // Tạo JWT token với departmentId
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      roleId: user.roleId ? user.roleId._id.toString() : null,
      roleName: user.roleId ? user.roleId.name : null,
      departmentId: user.departmentId ? user.departmentId._id.toString() : null,
      permissions: userPermissions,
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables.")
      return NextResponse.json({ error: "Lỗi cấu hình máy chủ" }, { status: 500 })
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" })

    // Ghi log audit cho đăng nhập thành công
    await createAuditLog({
      userId: user._id.toString(),
      action: "login",
      resourceType: "User",
      resourceId: user._id.toString(),
      newData: { email: user.email, status: "success" },
      description: `Người dùng ${user.email} đã đăng nhập thành công.`,
      request: request as any,
    })

    // Trả về thông tin người dùng (không bao gồm mật khẩu) và token
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      roleId: user.roleId ? user.roleId._id : null,
      role: user.roleId ? user.roleId.displayName : null,
      departmentId: user.departmentId ? { _id: user.departmentId._id, name: user.departmentId.name } : null,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      permissions: userPermissions, // Trả về tên quyền cho client
    }

    return NextResponse.json({ user: userResponse, token }, { status: 200 })
  } catch (error) {
    console.error("Lỗi đăng nhập:", error)
    await createAuditLog({
      userId: "system",
      action: "login",
      resourceType: "System",
      resourceId: "unknown",
      newData: { email, error: (error as Error).message },
      description: `Lỗi hệ thống trong quá trình đăng nhập cho email: ${email}. Lỗi: ${(error as Error).message}`,
      request: request as any,
    })
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}