import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { getUserIdFromToken } from "@/lib/auth"
import { createDepartment, getDepartments, getDepartmentHierarchy } from "@/lib/department"
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
    const hierarchy = searchParams.get("hierarchy") === "true"
    const includeInactive = searchParams.get("includeInactive") === "true"

    if (hierarchy) {
      const departments = await getDepartmentHierarchy()
      return NextResponse.json(departments)
    } else {
      const departments = await getDepartments({ includeInactive })
      return NextResponse.json(departments)
    }
  } catch (error) {
    console.error("GET /api/departments error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy danh sách phòng ban" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, managerId, parentDepartmentId, code } = await request.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Tên phòng ban phải có ít nhất 2 ký tự" }, { status: 400 })
    }

    if (managerId && !mongoose.Types.ObjectId.isValid(managerId)) {
      return NextResponse.json({ error: "ID trưởng phòng không hợp lệ" }, { status: 400 })
    }
    if (parentDepartmentId && !mongoose.Types.ObjectId.isValid(parentDepartmentId)) {
      return NextResponse.json({ error: "ID phòng ban cha không hợp lệ" }, { status: 400 })
    }

    const department = await createDepartment({
      name: name.trim(),
      description: description?.trim(),
      managerId,
      parentDepartmentId,
      code: code?.trim(),
    })

    await createAuditLog({
      userId,
      action: "create",
      resourceType: "Department",
      resourceId: department._id.toString(),
      newData: department,
      description: `Tạo phòng ban: ${department.name}`,
      request,
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error("POST /api/departments error:", error)
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Tên phòng ban hoặc mã phòng ban đã tồn tại" }, { status: 400 })
    }
    return NextResponse.json({ error: "Có lỗi xảy ra khi tạo phòng ban" }, { status: 500 })
  }
}
