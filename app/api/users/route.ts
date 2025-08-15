import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { User } from "@/models/User"
import { Department } from "@/models/Department"
import { Role } from "@/models/Role"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"
import { createAuditLog } from "@/lib/audit"
import { getUserIdFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("departmentId")
    const status = searchParams.get("status")
    const searchTerm = searchParams.get("searchTerm")

    const query: any = {}
    if (departmentId && departmentId !== "all") {
      query.departmentId = new mongoose.Types.ObjectId(departmentId)
    }
    if (status && status !== "all") {
      query.status = status
    }
    if (searchTerm) {
      query.$or = [{ name: { $regex: searchTerm, $options: "i" } }, { email: { $regex: searchTerm, $options: "i" } }]
    }

    const users = await User.find(query)
      .select("-password")
      .populate("roleId", "name displayName level")
      .populate("departmentId", "name")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy danh sách người dùng" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const requestorId = await getUserIdFromToken(request)
    if (!requestorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await request.json()

    if (!userData.name || userData.name.trim().length < 3) {
      return NextResponse.json({ error: "Tên người dùng phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 })
    }
    if (!userData.password || userData.password.length < 6) {
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

    const existingUser = await User.findOne({ email: userData.email })
    if (existingUser) {
      return NextResponse.json({ error: "Email đã được sử dụng." }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const newUser = new User({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      roleId: userData.roleId,
      departmentId: userData.departmentId,
      status: userData.status || "active",
    })

    await newUser.save()

    const userResponse = await User.findById(newUser._id)
      .select("-password")
      .populate("roleId", "name displayName level")
      .populate("departmentId", "name")
      .lean()

    await createAuditLog({
      userId: requestorId,
      action: "create",
      resourceType: "User",
      resourceId: newUser._id.toString(),
      newData: userResponse,
      description: `Tạo người dùng mới: ${newUser.email}`,
      request,
    })

    return NextResponse.json(userResponse, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi tạo người dùng." }, { status: 500 })
  }
}
