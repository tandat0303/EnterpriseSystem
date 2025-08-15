import { dbConnect } from "@/lib/mongodb"
import { Setting } from "@/models/Setting"
import mongoose from "mongoose"

// Default settings to be seeded
export const defaultSettings = [
  {
    key: "email_notifications_enabled",
    value: true,
    type: "boolean",
    description: "Bật/tắt gửi thông báo qua email cho người dùng.",
    category: "email",
    isPublic: false,
  },
  {
    key: "system_name",
    value: "ApprovalFlow Pro",
    type: "string",
    description: "Tên của hệ thống, hiển thị trên giao diện người dùng.",
    category: "system",
    isPublic: true,
  },
  {
    key: "default_workflow_id",
    value: null, // Sẽ là ObjectId của một workflow mặc định
    type: "string", // Lưu trữ dưới dạng string ObjectId
    description: "ID của luồng phê duyệt mặc định cho các biểu mẫu mới.",
    category: "workflow",
    isPublic: false,
  },
  {
    key: "max_file_upload_size_mb",
    value: 10,
    type: "number",
    description: "Kích thước tối đa cho phép tải lên tệp (MB).",
    category: "system",
    isPublic: true,
  },
  {
    key: "audit_log_retention_days",
    value: 365,
    type: "number",
    description: "Số ngày lưu trữ nhật ký kiểm toán.",
    category: "system",
    isPublic: false,
  },
  {
    key: "contact_email",
    value: "support@example.com",
    type: "string",
    description: "Địa chỉ email hỗ trợ khách hàng.",
    category: "email",
    isPublic: true,
  },
  {
    key: "allow_self_registration",
    value: false,
    type: "boolean",
    description: "Cho phép người dùng tự đăng ký tài khoản.",
    category: "security",
    isPublic: true,
  },
  {
    key: "notification_sound_enabled",
    value: true,
    type: "boolean",
    description: "Bật/tắt âm thanh thông báo trên giao diện người dùng.",
    category: "notification",
    isPublic: true,
  },
]

export async function seedSettings() {
  await dbConnect()

  console.log("Seeding default settings...")
  for (const settingData of defaultSettings) {
    const existingSetting = await Setting.findOne({ key: settingData.key })
    if (!existingSetting) {
      await Setting.create(settingData)
      console.log(`Created setting: ${settingData.key}`)
    } else {
      // Optionally update existing settings if their values or types change in default
      await Setting.updateOne(
        { key: settingData.key },
        {
          $set: {
            value: settingData.value,
            type: settingData.type,
            description: settingData.description,
            category: settingData.category,
            isPublic: settingData.isPublic,
          },
        },
      )
      console.log(`Updated setting: ${settingData.key}`)
    }
  }
  console.log("Settings seeding complete.")
}

export async function getSetting(key: string): Promise<any | null> {
  await dbConnect()
  const setting = await Setting.findOne({ key }).lean()
  return setting ? setting.value : null
}

export async function getAllSettings(): Promise<Setting[]> {
  await dbConnect()
  const settings = await Setting.find({}).populate("updatedBy", "name email").lean()
  return settings as Setting[]
}

export async function updateSetting(key: string, value: any, updatedByUserId?: string): Promise<Setting | null> {
  await dbConnect()

  const updateFields: any = { value, updatedAt: new Date() }
  if (updatedByUserId && mongoose.Types.ObjectId.isValid(updatedByUserId)) {
    updateFields.updatedBy = new mongoose.Types.ObjectId(updatedByUserId)
  } else {
    updateFields.updatedBy = null // Hoặc để undefined nếu không muốn lưu
  }

  const updatedSetting = await Setting.findOneAndUpdate({ key }, updateFields, { new: true }).lean()
  return updatedSetting as Setting | null
}
