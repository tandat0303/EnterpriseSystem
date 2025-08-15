import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { getUserIdFromToken } from "@/lib/auth"
import { Permission } from "@/models/Permission"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const searchTerm = searchParams.get("searchTerm")

    const query: any = {}
    if (category && category !== "all") {
      query.category = category
    }
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

    const permissions = await Permission.find(query).sort({ category: 1, displayName: 1 }).lean()

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("GET /api/permissions error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy danh sách quyền hạn" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const permissionData = await request.json()

    if (
      !permissionData.name ||
      !permissionData.displayName ||
      !permissionData.category ||
      !permissionData.resource ||
      !permissionData.action
    ) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 })
    }

    const existingPermission = await Permission.findOne({ name: permissionData.name })
    if (existingPermission) {
      return NextResponse.json({ error: "Tên quyền hạn đã tồn tại" }, { status: 400 })
    }

    const permission = new Permission(permissionData)
    await permission.save()

    await createAuditLog({
      userId,
      action: "create",
      resourceType: "Permission",
      resourceId: permission._id.toString(),
      newData: permission,
      description: `Tạo quyền hạn: ${permission.displayName}`,
      request,
    })

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error("POST /api/permissions error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi tạo quyền hạn" }, { status: 500 })
  }
}
