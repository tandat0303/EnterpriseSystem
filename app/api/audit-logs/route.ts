import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { getUserIdFromToken } from "@/lib/auth"
import { getAuditLogs } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filterUserId = searchParams.get("userId")
    const resourceType = searchParams.get("resourceType")
    const action = searchParams.get("action")
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
    const skip = Number.parseInt(searchParams.get("skip") || "0", 10)

    const logs = await getAuditLogs({
      userId: filterUserId || undefined,
      resourceType: resourceType || undefined,
      action: action || undefined,
      limit,
      skip,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("GET /api/audit-logs error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy nhật ký kiểm toán." }, { status: 500 })
  }
}
