import { dbConnect } from "@/lib/mongodb"
import { Notification } from "@/models/Notification"
import mongoose from "mongoose"

type NotificationType = "form_submitted" | "approval_required" | "form_approved" | "form_rejected" | "feedback_received" | "user_assigned_role" | "department_assigned_manager" | "system_alert" | "submission_pending" | "submission_approved" | "submission_rejected" | "new_assignment"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  read?: boolean
  relatedFormId?: string
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  read = false,
  relatedFormId,
}: CreateNotificationParams) {
  try {
    await dbConnect()

    const newNotification = new Notification({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      title,
      message,
      read,
      relatedFormId: relatedFormId ? new mongoose.Types.ObjectId(relatedFormId) : undefined,
    })

    await newNotification.save()
    return newNotification.toObject()
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await dbConnect()
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true },
    ).lean()
    return updatedNotification
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export async function getNotificationsForUser(userId: string, readStatus?: boolean, limit = 10, skip = 0) {
  try {
    await dbConnect()
    const query: any = { userId: new mongoose.Types.ObjectId(userId) }
    if (readStatus !== undefined) {
      query.read = readStatus
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).lean()

    const unreadCount = await Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), read: false })

    return { notifications, unreadCount }
  } catch (error) {
    console.error("Error getting notifications for user:", error)
    return { notifications: [], unreadCount: 0 }
  }
}