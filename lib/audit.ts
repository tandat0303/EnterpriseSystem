import { dbConnect } from "@/lib/mongodb"
import { AuditLog } from "@/models/AuditLog"
import mongoose from "mongoose"
import type { NextRequest } from "next/server"

interface CreateAuditLogParams {
  userId: string // ID của người dùng thực hiện hành động, hoặc "system", "anonymous"
  action: string
  resourceType: string
  resourceId?: string // ID của tài nguyên bị ảnh hưởng
  oldData?: any
  newData?: any
  description?: string
  request?: NextRequest // Thêm request để lấy IP và User-Agent
}

export async function createAuditLog({
  userId,
  action,
  resourceType,
  resourceId,
  oldData,
  newData,
  description,
  request,
}: CreateAuditLogParams) {
  try {
    await dbConnect()

    let ipAddress: string | undefined
    let userAgent: string | undefined

    if (request) {
      ipAddress = request.headers.get("x-forwarded-for") || request.ip
      userAgent = request.headers.get("user-agent") || undefined
    }

    const log = new AuditLog({
      userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null, // Chuyển đổi sang ObjectId nếu hợp lệ
      action,
      resourceType,
      resourceId:
        resourceId && mongoose.Types.ObjectId.isValid(resourceId) ? new mongoose.Types.ObjectId(resourceId) : null,
      oldData,
      newData,
      description,
      ipAddress,
      userAgent,
    })

    await log.save()
  } catch (error) {
    console.error("Error creating audit log:", error)
    // Không throw lỗi để không ảnh hưởng đến luồng chính của ứng dụng
  }
}

interface GetAuditLogsParams {
  userId?: string
  resourceType?: string
  action?: string
  limit?: number
  skip?: number
}

export async function getAuditLogs({ userId, resourceType, action, limit = 50, skip = 0 }: GetAuditLogsParams) {
  try {
    await dbConnect()

    const query: any = {}
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new mongoose.Types.ObjectId(userId)
    } else if (userId === "system") {
      query.userId = null // Lọc các log không có userId (ví dụ: system, anonymous)
    }
    if (resourceType) {
      query.resourceType = resourceType
    }
    if (action) {
      query.action = action
    }

    const logs = await AuditLog.find(query)
      .populate("userId", "name email") // Populate user info
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    return logs
  } catch (error) {
    console.error("Error getting audit logs:", error)
    return []
  }
}
