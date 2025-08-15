const { MongoClient } = require("mongodb")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI không được tìm thấy trong .env.local")
  process.exit(1)
}

// Default Permissions
const defaultPermissions = [
  // Dashboard
  {
    name: "view_dashboard",
    displayName: "Xem tổng quan",
    description: "Xem trang tổng quan hệ thống",
    category: "dashboard",
    resource: "dashboard",
    action: "view",
    isSystem: true,
    status: "active",
  },

  // Forms
  {
    name: "manage_forms",
    displayName: "Quản lý biểu mẫu",
    description: "Tạo, sửa, xóa biểu mẫu",
    category: "forms",
    resource: "forms",
    action: "manage",
    isSystem: true,
    status: "active",
  },
  {
    name: "view_forms",
    displayName: "Xem biểu mẫu",
    description: "Xem danh sách biểu mẫu",
    category: "forms",
    resource: "forms",
    action: "view",
    isSystem: true,
    status: "active",
  },
  {
    name: "create_forms",
    displayName: "Tạo biểu mẫu",
    description: "Tạo biểu mẫu mới",
    category: "forms",
    resource: "forms",
    action: "create",
    isSystem: true,
    status: "active",
  },

  // Submissions
  {
    name: "submit_forms",
    displayName: "Gửi biểu mẫu",
    description: "Gửi biểu mẫu để phê duyệt",
    category: "submissions",
    resource: "submissions",
    action: "submit",
    isSystem: true,
    status: "active",
  },
  {
    name: "view_own_submissions",
    displayName: "Xem biểu mẫu của mình",
    description: "Xem biểu mẫu đã gửi của bản thân",
    category: "submissions",
    resource: "submissions",
    action: "view",
    isSystem: true,
    status: "active",
  },
  {
    name: "approve_forms",
    displayName: "Phê duyệt biểu mẫu",
    description: "Phê duyệt hoặc từ chối biểu mẫu",
    category: "submissions",
    resource: "submissions",
    action: "approve",
    isSystem: true,
    status: "active",
  },

  // Workflows
  {
    name: "manage_workflows",
    displayName: "Quản lý luồng phê duyệt",
    description: "Tạo, sửa, xóa luồng phê duyệt",
    category: "workflows",
    resource: "workflows",
    action: "manage",
    isSystem: true,
    status: "active",
  },
  {
    name: "view_workflows",
    displayName: "Xem luồng phê duyệt",
    description: "Xem danh sách luồng phê duyệt",
    category: "workflows",
    resource: "workflows",
    action: "view",
    isSystem: true,
    status: "active",
  },

  // Users
  {
    name: "manage_users",
    displayName: "Quản lý người dùng",
    description: "Tạo, sửa, xóa người dùng",
    category: "users",
    resource: "users",
    action: "manage",
    isSystem: true,
    status: "active",
  },
  {
    name: "view_users",
    displayName: "Xem người dùng",
    description: "Xem danh sách người dùng",
    category: "users",
    resource: "users",
    action: "view",
    isSystem: true,
    status: "active",
  },

  // Departments
  {
    name: "manage_departments",
    displayName: "Quản lý phòng ban",
    description: "Tạo, sửa, xóa phòng ban",
    category: "departments",
    resource: "departments",
    action: "manage",
    isSystem: true,
    status: "active",
  },
  {
    name: "view_departments",
    displayName: "Xem phòng ban",
    description: "Xem danh sách phòng ban",
    category: "departments",
    resource: "departments",
    action: "view",
    isSystem: true,
    status: "active",
  },

  // Settings
  {
    name: "manage_settings",
    displayName: "Quản lý cài đặt",
    description: "Cấu hình cài đặt hệ thống",
    category: "settings",
    resource: "settings",
    action: "manage",
    isSystem: true,
    status: "active",
  },

  // System
  {
    name: "manage_roles",
    displayName: "Quản lý vai trò",
    description: "Tạo, sửa, xóa vai trò",
    category: "system",
    resource: "roles",
    action: "manage",
    isSystem: true,
    status: "active",
  },
  {
    name: "view_notifications",
    displayName: "Xem thông báo",
    description: "Xem thông báo hệ thống",
    category: "system",
    resource: "notifications",
    action: "view",
    isSystem: true,
    status: "active",
  },
]

async function initPermissions() {
  let client

  try {
    console.log("🔄 Đang kết nối tới MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("✅ Kết nối MongoDB thành công!")

    const db = client.db()

    // Clear existing permissions
    console.log("🗑️  Đang xóa quyền hạn cũ...")
    await db.collection("permissions").deleteMany({})

    // Insert permissions
    console.log("🔐 Đang thêm quyền hạn...")
    const permissionsResult = await db.collection("permissions").insertMany(defaultPermissions)
    console.log(`✅ Đã thêm ${permissionsResult.insertedCount} quyền hạn`)

    console.log("\n🎉 Khởi tạo permissions hoàn thành!")
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo permissions:", error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("🔌 Đã đóng kết nối MongoDB")
    }
  }
}

// Run the init function
initPermissions()
