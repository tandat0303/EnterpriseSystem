import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Notification } from "@/models/Notification"
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
    const readStatus = searchParams.get("read")
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const skip = Number.parseInt(searchParams.get("skip") || "0", 10)

    const query: any = { userId: new mongoose.Types.ObjectId(userId) }
    if (readStatus === "true") {
      query.read = true
    } else if (readStatus === "false") {
      query.read = false
    }

    const notifications = await Notification.find(query)
      .populate("userId", "name email")
      .populate("relatedFormId", "formTemplateId submitterId status")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    const unreadCount = await Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), read: false })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("GET /api/notifications error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi lấy danh sách thông báo." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationData = await request.json()

    if (!notificationData.userId || !mongoose.Types.ObjectId.isValid(notificationData.userId)) {
      return NextResponse.json({ error: "ID người nhận thông báo không hợp lệ." }, { status: 400 })
    }
    if (!notificationData.type || !notificationData.title || !notificationData.message) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc cho thông báo." }, { status: 400 })
    }

    const newNotification = new Notification({
      ...notificationData,
      userId: new mongoose.Types.ObjectId(notificationData.userId),
      relatedFormId: notificationData.relatedFormId
        ? new mongoose.Types.ObjectId(notificationData.relatedFormId)
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newNotification.save()

    await createAuditLog({
      userId,
      action: "create",
      resourceType: "Notification",
      resourceId: newNotification._id.toString(),
      newData: newNotification,
      description: `Tạo thông báo cho người dùng ${notificationData.userId}: ${notificationData.title}`,
      request,
    })

    return NextResponse.json(newNotification, { status: 201 })
  } catch (error) {
    console.error("POST /api/notifications error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi tạo thông báo." }, { status: 500 })
  }
}
