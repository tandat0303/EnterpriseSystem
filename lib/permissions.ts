import { dbConnect } from "@/lib/mongodb"
import { Permission } from "@/models/Permission"
import { Role } from "@/models/Role"
import { User } from "@/models/User"
import mongoose from "mongoose"

// Default permissions to be seeded
export const defaultPermissions = [
  // Dashboard
  {
    name: "dashboard_view",
    displayName: "Xem Dashboard",
    description: "Cho phép xem trang tổng quan",
    category: "dashboard",
    resource: "dashboard",
    action: "view",
    isSystem: true,
  },

  // Forms
  {
    name: "form_template_create",
    displayName: "Tạo biểu mẫu",
    description: "Cho phép tạo biểu mẫu mới",
    category: "forms",
    resource: "form_template",
    action: "create",
    isSystem: true,
  },
  {
    name: "form_template_read",
    displayName: "Xem biểu mẫu",
    description: "Cho phép xem danh sách và chi tiết biểu mẫu",
    category: "forms",
    resource: "form_template",
    action: "read",
    isSystem: true,
  },
  {
    name: "form_template_update",
    displayName: "Cập nhật biểu mẫu",
    description: "Cho phép chỉnh sửa biểu mẫu hiện có",
    category: "forms",
    resource: "form_template",
    action: "update",
    isSystem: true,
  },
  {
    name: "form_template_delete",
    displayName: "Xóa biểu mẫu",
    description: "Cho phép xóa biểu mẫu",
    category: "forms",
    resource: "form_template",
    action: "delete",
    isSystem: true,
  },

  // Submissions
  {
    name: "form_submission_submit",
    displayName: "Gửi đơn",
    description: "Cho phép gửi đơn từ biểu mẫu",
    category: "submissions",
    resource: "form_submission",
    action: "submit",
    isSystem: true,
  },
  {
    name: "form_submission_read_own",
    displayName: "Xem đơn của mình",
    description: "Cho phép xem các đơn đã gửi của bản thân",
    category: "submissions",
    resource: "form_submission",
    action: "read",
    isSystem: true,
  },
  {
    name: "form_submission_read_all",
    displayName: "Xem tất cả đơn",
    description: "Cho phép xem tất cả các đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "read",
    isSystem: true,
  },
  {
    name: "form_submission_approve",
    displayName: "Phê duyệt đơn",
    description: "Cho phép phê duyệt các đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "approve",
    isSystem: true,
  },
  {
    name: "form_submission_reject",
    displayName: "Từ chối đơn",
    description: "Cho phép từ chối các đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "reject",
    isSystem: true,
  },
  {
    name: "form_submission_feedback",
    displayName: "Yêu cầu phản hồi đơn",
    description: "Cho phép yêu cầu phản hồi trên đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "feedback",
    isSystem: true,
  },
  {
    name: "form_submission_delete",
    displayName: "Xóa đơn gửi",
    description: "Cho phép xóa đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "delete",
    isSystem: true,
  },

  // Workflows
  {
    name: "workflow_create",
    displayName: "Tạo luồng phê duyệt",
    description: "Cho phép tạo luồng phê duyệt mới",
    category: "workflows",
    resource: "workflow",
    action: "create",
    isSystem: true,
  },
  {
    name: "workflow_read",
    displayName: "Xem luồng phê duyệt",
    description: "Cho phép xem danh sách và chi tiết luồng phê duyệt",
    category: "workflows",
    resource: "workflow",
    action: "read",
    isSystem: true,
  },
  {
    name: "workflow_update",
    displayName: "Cập nhật luồng phê duyệt",
    description: "Cho phép chỉnh sửa luồng phê duyệt hiện có",
    category: "workflows",
    resource: "workflow",
    action: "update",
    isSystem: true,
  },
  {
    name: "workflow_delete",
    displayName: "Xóa luồng phê duyệt",
    description: "Cho phép xóa luồng phê duyệt",
    category: "workflows",
    resource: "workflow",
    action: "delete",
    isSystem: true,
  },

  // Users
  {
    name: "user_create",
    displayName: "Tạo người dùng",
    description: "Cho phép tạo người dùng mới",
    category: "users",
    resource: "user",
    action: "create",
    isSystem: true,
  },
  {
    name: "user_read",
    displayName: "Xem người dùng",
    description: "Cho phép xem danh sách và chi tiết người dùng",
    category: "users",
    resource: "user",
    action: "read",
    isSystem: true,
  },
  {
    name: "user_update",
    displayName: "Cập nhật người dùng",
    description: "Cho phép chỉnh sửa thông tin người dùng",
    category: "users",
    resource: "user",
    action: "update",
    isSystem: true,
  },
  {
    name: "user_delete",
    displayName: "Xóa người dùng",
    description: "Cho phép xóa người dùng",
    category: "users",
    resource: "user",
    action: "delete",
    isSystem: true,
  },

  // Departments
  {
    name: "department_create",
    displayName: "Tạo phòng ban",
    description: "Cho phép tạo phòng ban mới",
    category: "departments",
    resource: "department",
    action: "create",
    isSystem: true,
  },
  {
    name: "department_read",
    displayName: "Xem phòng ban",
    description: "Cho phép xem danh sách và chi tiết phòng ban",
    category: "departments",
    resource: "department",
    action: "read",
    isSystem: true,
  },
  {
    name: "department_update",
    displayName: "Cập nhật phòng ban",
    description: "Cho phép chỉnh sửa thông tin phòng ban",
    category: "departments",
    resource: "department",
    action: "update",
    isSystem: true,
  },
  {
    name: "department_delete",
    displayName: "Xóa phòng ban",
    description: "Cho phép xóa phòng ban",
    category: "departments",
    resource: "department",
    action: "delete",
    isSystem: true,
  },

  // Roles
  {
    name: "role_create",
    displayName: "Tạo vai trò",
    description: "Cho phép tạo vai trò mới",
    category: "roles",
    resource: "role",
    action: "create",
    isSystem: true,
  },
  {
    name: "role_read",
    displayName: "Xem vai trò",
    description: "Cho phép xem danh sách và chi tiết vai trò",
    category: "roles",
    resource: "role",
    action: "read",
    isSystem: true,
  },
  {
    name: "role_update",
    displayName: "Cập nhật vai trò",
    description: "Cho phép chỉnh sửa vai trò",
    category: "roles",
    resource: "role",
    action: "update",
    isSystem: true,
  },
  {
    name: "role_delete",
    displayName: "Xóa vai trò",
    description: "Cho phép xóa vai trò",
    category: "roles",
    resource: "role",
    action: "delete",
    isSystem: true,
  },

  // Permissions
  {
    name: "permission_read",
    displayName: "Xem quyền hạn",
    description: "Cho phép xem danh sách và chi tiết quyền hạn",
    category: "permissions",
    resource: "permission",
    action: "read",
    isSystem: true,
  },
  {
    name: "permission_create",
    displayName: "Tạo quyền hạn",
    description: "Cho phép tạo quyền hạn mới",
    category: "permissions",
    resource: "permission",
    action: "create",
    isSystem: true,
  },
  {
    name: "permission_update",
    displayName: "Cập nhật quyền hạn",
    description: "Cho phép chỉnh sửa quyền hạn",
    category: "permissions",
    resource: "permission",
    action: "update",
    isSystem: true,
  },
  {
    name: "permission_delete",
    displayName: "Xóa quyền hạn",
    description: "Cho phép xóa quyền hạn",
    category: "permissions",
    resource: "permission",
    action: "delete",
    isSystem: true,
  },

  // Settings
  {
    name: "setting_read",
    displayName: "Xem cài đặt",
    description: "Cho phép xem cài đặt hệ thống",
    category: "settings",
    resource: "setting",
    action: "read",
    isSystem: true,
  },
  {
    name: "setting_update",
    displayName: "Cập nhật cài đặt",
    description: "Cho phép cập nhật cài đặt hệ thống",
    category: "settings",
    resource: "setting",
    action: "update",
    isSystem: true,
  },

  // Audit Logs
  {
    name: "audit_log_read",
    displayName: "Xem nhật ký kiểm toán",
    description: "Cho phép xem nhật ký kiểm toán",
    category: "audit_logs",
    resource: "audit_log",
    action: "read",
    isSystem: true,
  },

  // Notifications
  {
    name: "notification_read",
    displayName: "Xem thông báo",
    description: "Cho phép xem thông báo của bản thân",
    category: "notifications",
    resource: "notification",
    action: "read",
    isSystem: true,
  },
  {
    name: "notification_manage",
    displayName: "Quản lý thông báo",
    description: "Cho phép quản lý tất cả thông báo (admin)",
    category: "notifications",
    resource: "notification",
    action: "manage",
    isSystem: true,
  },
]

// Default roles and their associated permissions (by name)
export const defaultRoles = [
  {
    name: "super_admin",
    displayName: "Quản trị viên tối cao",
    description: "Có toàn quyền truy cập và quản lý hệ thống.",
    level: 100,
    isSystem: true,
    permissions: defaultPermissions.map((p) => p.name), // All permissions
  },
  {
    name: "admin",
    displayName: "Quản trị viên",
    description: "Quản lý người dùng, vai trò, phòng ban, biểu mẫu và luồng phê duyệt.",
    level: 90,
    isSystem: true,
    permissions: [
      "dashboard_view",
      "form_template_create",
      "form_template_read",
      "form_template_update",
      "form_template_delete",
      "form_submission_read_all",
      "form_submission_approve",
      "form_submission_reject",
      "form_submission_feedback",
      "form_submission_delete",
      "workflow_create",
      "workflow_read",
      "workflow_update",
      "workflow_delete",
      "user_create",
      "user_read",
      "user_update",
      "user_delete",
      "department_create",
      "department_read",
      "department_update",
      "department_delete",
      "role_create",
      "role_read",
      "role_update",
      "role_delete",
      "permission_read",
      "permission_create",
      "permission_update",
      "permission_delete",
      "setting_read",
      "setting_update",
      "audit_log_read",
      "notification_read",
      "notification_manage",
    ],
  },
  {
    name: "manager",
    displayName: "Trưởng phòng",
    description: "Quản lý các đơn gửi trong phòng ban, xem báo cáo.",
    level: 70,
    isSystem: true,
    permissions: [
      "dashboard_view",
      "form_template_read",
      "form_submission_submit",
      "form_submission_read_own",
      "form_submission_read_all",
      "form_submission_approve",
      "form_submission_reject",
      "form_submission_feedback",
      "workflow_read",
      "user_read",
      "department_read",
      "notification_read",
    ],
  },
  {
    name: "employee",
    displayName: "Nhân viên",
    description: "Gửi đơn và xem các đơn của mình.",
    level: 10,
    isSystem: true,
    permissions: [
      "dashboard_view",
      "form_template_read",
      "form_submission_submit",
      "form_submission_read_own",
      "notification_read",
    ],
  },
]

export async function seedPermissionsAndRoles() {
  await dbConnect()

  console.log("Seeding default permissions...")
  const createdPermissions: { [key: string]: mongoose.Types.ObjectId } = {}
  for (const permData of defaultPermissions) {
    const existingPerm = await Permission.findOne({ name: permData.name })
    if (!existingPerm) {
      const newPerm = await Permission.create(permData)
      createdPermissions[newPerm.name] = newPerm._id
      console.log(`Created permission: ${newPerm.displayName}`)
    } else {
      createdPermissions[existingPerm.name] = existingPerm._id
      console.log(`Permission already exists: ${existingPerm.displayName}`)
    }
  }

  console.log("Seeding default roles...")
  for (const roleData of defaultRoles) {
    const existingRole = await Role.findOne({ name: roleData.name })
    const permissionObjectIds = roleData.permissions.map((permName) => createdPermissions[permName]).filter(Boolean) // Filter out any undefined/null if a permission name wasn't found

    if (!existingRole) {
      await Role.create({
        ...roleData,
        permissions: permissionObjectIds,
      })
      console.log(`Created role: ${roleData.displayName}`)
    } else {
      // Update existing role's permissions and other fields if necessary
      await Role.updateOne(
        { name: roleData.name },
        {
          $set: {
            displayName: roleData.displayName,
            description: roleData.description,
            level: roleData.level,
            isSystem: roleData.isSystem,
            permissions: permissionObjectIds,
          },
        },
      )
      console.log(`Updated role: ${roleData.displayName}`)
    }
  }
  console.log("Seeding complete.")
}

// Helper function to check if a user has a specific permission
export async function checkPermission(userId: string, permissionName: string): Promise<boolean> {
  await dbConnect()

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.warn(`Invalid userId provided to checkPermission: ${userId}`)
    return false
  }

  const user = await User.findById(userId)
    .populate({
      path: "roleId",
      model: Role,
      populate: {
        path: "permissions",
        model: Permission,
      },
    })
    .lean()

  if (!user || !user.roleId || !user.roleId.permissions) {
    return false
  }

  // Check if the user's role has the required permission
  const hasPermission = user.roleId.permissions.some((perm: any) => perm.name === permissionName)
  return hasPermission
}

// Helper function to get all permissions for a user
export async function getUserPermissions(userId: string): Promise<string[]> {
  await dbConnect()

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.warn(`Invalid userId provided to getUserPermissions: ${userId}`)
    return []
  }

  const user = await User.findById(userId)
    .populate({
      path: "roleId",
      model: Role,
      populate: {
        path: "permissions",
        model: Permission,
      },
    })
    .lean()

  if (!user || !user.roleId || !user.roleId.permissions) {
    return []
  }

  return user.roleId.permissions.map((perm: any) => perm.name)
}
