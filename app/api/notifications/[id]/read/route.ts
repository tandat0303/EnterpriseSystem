import { type NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Notification } from "@/models/Notification"
import { getUserIdFromToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import mongoose from "mongoose"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID thông báo không hợp lệ" }, { status: 400 })
    }

    const notification = await Notification.findById(id).lean()

    if (!notification) {
      return NextResponse.json({ error: "Thông báo không tìm thấy." }, { status: 404 })
    }

    if (notification.userId.toString() !== userId) {
      return NextResponse.json({ error: "Bạn không có quyền truy cập thông báo này." }, { status: 403 })
    }

    if (notification.read) {
      return NextResponse.json({ message: "Thông báo đã được đánh dấu là đã đọc trước đó." })
    }

    const updatedNotification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true }).lean()

    await createAuditLog({
      userId,
      action: "update",
      resourceType: "Notification",
      resourceId: id,
      oldData: notification,
      newData: updatedNotification,
      description: `Đánh dấu thông báo là đã đọc: ${notification.title}`,
      request,
    })

    return NextResponse.json({ message: "Thông báo đã được đánh dấu là đã đọc.", notification: updatedNotification })
  } catch (error) {
    console.error("POST /api/notifications/[id]/read error:", error)
    return NextResponse.json({ error: "Có lỗi xảy ra khi đánh dấu thông báo là đã đọc." }, { status: 500 })
  }
}
