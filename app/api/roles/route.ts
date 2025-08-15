import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Role } from "@/models/Role"
import { Permission } from "@/models/Permission"
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
    const status = searchParams.get("status")
    const searchTerm = searchParams.get("searchTerm")

    const query: any = {}
    if (status && status !== "all") {
      query.status = status
    }
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { displayName: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ]
    }

    const roles = await Role.find(query)
      .populate("permissions", "name displayName category")
      .populate("createdBy", "name email")
      .sort({ level: -1, createdAt: -1 })
      .lean()

    return NextResponse.json(roles)
  } catch (error) {
    console.error("GET /api/roles error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy danh sách vai trò" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roleData = await request.json()

    if (!roleData.name || roleData.name.trim().length < 3) {
      return NextResponse.json({ error: "Tên vai trò phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (!roleData.displayName || roleData.displayName.trim().length < 3) {
      return NextResponse.json({ error: "Tên hiển thị vai trò phải có ít nhất 3 ký tự." }, { status: 400 })
    }
    if (roleData.level === undefined || roleData.level < 1 || roleData.level > 100) {
      return NextResponse.json({ error: "Cấp độ vai trò phải từ 1 đến 100." }, { status: 400 })
    }

    const existingRole = await Role.findOne({ name: roleData.name })
    if (existingRole) {
      return NextResponse.json({ error: "Tên vai trò đã tồn tại." }, { status: 400 })
    }

    if (roleData.permissions && Array.isArray(roleData.permissions)) {
      for (const permId of roleData.permissions) {
        if (!mongoose.Types.ObjectId.isValid(permId)) {
          return NextResponse.json({ error: `ID quyền hạn không hợp lệ: ${permId}` }, { status: 400 })
        }
        const exists = await Permission.findById(permId)
        if (!exists) {
          return NextResponse.json({ error: `Quyền hạn với ID ${permId} không tồn tại.` }, { status: 400 })
        }
      }
    } else {
      roleData.permissions = []
    }

    const newRole = new Role({
      ...roleData,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newRole.save()

    const createdRole = await Role.findById(newRole._id)
      .populate("permissions", "name displayName category")
      .populate("createdBy", "name email")
      .lean()

    await createAuditLog({
      userId,
      action: "create",
      resourceType: "Role",
      resourceId: newRole._id.toString(),
      newData: createdRole,
      description: `Tạo vai trò mới: ${newRole.displayName}`,
      request,
    })

    return NextResponse.json(createdRole, { status: 201 })
  } catch (error) {
    console.error("POST /api/roles error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi tạo vai trò." }, { status: 500 })
  }
}
