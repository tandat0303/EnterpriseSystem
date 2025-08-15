const { MongoClient, ObjectId } = require("mongodb")
const bcrypt = require("bcryptjs")

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
    name: "dashboard_view",
    displayName: "Xem Dashboard",
    description: "Cho phép xem trang tổng quan",
    category: "dashboard",
    resource: "dashboard",
    action: "view",
    isSystem: true,
    status: "active",
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
    status: "active",
  },
  {
    name: "form_template_read",
    displayName: "Xem biểu mẫu",
    description: "Cho phép xem danh sách và chi tiết biểu mẫu",
    category: "forms",
    resource: "form_template",
    action: "read",
    isSystem: true,
    status: "active",
  },
  {
    name: "form_template_update",
    displayName: "Cập nhật biểu mẫu",
    description: "Cho phép chỉnh sửa biểu mẫu hiện có",
    category: "forms",
    resource: "form_template",
    action: "update",
    isSystem: true,
    status: "active",
  },
  {
    name: "form_template_delete",
    displayName: "Xóa biểu mẫu",
    description: "Cho phép xóa biểu mẫu",
    category: "forms",
    resource: "form_template",
    action: "delete",
    isSystem: true,
    status: "active",
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
    status: "active",
  },
  {
    name: "form_submission_read_own",
    displayName: "Xem đơn của mình",
    description: "Cho phép xem các đơn đã gửi của bản thân",
    category: "submissions",
    resource: "form_submission",
    action: "read",
    isSystem: true,
    status: "active",
  },
  {
    name: "form_submission_read_all",
    displayName: "Xem tất cả đơn",
    description: "Cho phép xem tất cả các đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "read",
    isSystem: true,
    status: "active",
  },
  {
    name: "form_submission_approve",
    displayName: "Phê duyệt đơn",
    description: "Cho phép phê duyệt các đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "approve",
    isSystem: true,
    status: "active",
  },
  {
    name: "form_submission_reject",
    displayName: "Từ chối đơn",
    description: "Cho phép từ chối các đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "reject",
    isSystem: true,
    status: "active",
  },
  {
    name: "form_submission_feedback",
    displayName: "Yêu cầu phản hồi đơn",
    description: "Cho phép yêu cầu phản hồi trên đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "feedback",
    isSystem: true,
    status: "active",
  },
  {
    name: "form_submission_delete",
    displayName: "Xóa đơn gửi",
    description: "Cho phép xóa đơn gửi",
    category: "submissions",
    resource: "form_submission",
    action: "delete",
    isSystem: true,
    status: "active",
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
    status: "active",
  },
  {
    name: "workflow_read",
    displayName: "Xem luồng phê duyệt",
    description: "Cho phép xem danh sách và chi tiết luồng phê duyệt",
    category: "workflows",
    resource: "workflow",
    action: "read",
    isSystem: true,
    status: "active",
  },
  {
    name: "workflow_update",
    displayName: "Cập nhật luồng phê duyệt",
    description: "Cho phép chỉnh sửa luồng phê duyệt hiện có",
    category: "workflows",
    resource: "workflow",
    action: "update",
    isSystem: true,
    status: "active",
  },
  {
    name: "workflow_delete",
    displayName: "Xóa luồng phê duyệt",
    description: "Cho phép xóa luồng phê duyệt",
    category: "workflows",
    resource: "workflow",
    action: "delete",
    isSystem: true,
    status: "active",
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
    status: "active",
  },
  {
    name: "user_read",
    displayName: "Xem người dùng",
    description: "Cho phép xem danh sách và chi tiết người dùng",
    category: "users",
    resource: "user",
    action: "read",
    isSystem: true,
    status: "active",
  },
  {
    name: "user_update",
    displayName: "Cập nhật người dùng",
    description: "Cho phép chỉnh sửa thông tin người dùng",
    category: "users",
    resource: "user",
    action: "update",
    isSystem: true,
    status: "active",
  },
  {
    name: "user_delete",
    displayName: "Xóa người dùng",
    description: "Cho phép xóa người dùng",
    category: "users",
    resource: "user",
    action: "delete",
    isSystem: true,
    status: "active",
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
    status: "active",
  },
  {
    name: "department_read",
    displayName: "Xem phòng ban",
    description: "Cho phép xem danh sách và chi tiết phòng ban",
    category: "departments",
    resource: "department",
    action: "read",
    isSystem: true,
    status: "active",
  },
  {
    name: "department_update",
    displayName: "Cập nhật phòng ban",
    description: "Cho phép chỉnh sửa thông tin phòng ban",
    category: "departments",
    resource: "department",
    action: "update",
    isSystem: true,
    status: "active",
  },
  {
    name: "department_delete",
    displayName: "Xóa phòng ban",
    description: "Cho phép xóa phòng ban",
    category: "departments",
    resource: "department",
    action: "delete",
    isSystem: true,
    status: "active",
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
    status: "active",
  },
  {
    name: "role_read",
    displayName: "Xem vai trò",
    description: "Cho phép xem danh sách và chi tiết vai trò",
    category: "roles",
    resource: "role",
    action: "read",
    isSystem: true,
    status: "active",
  },
  {
    name: "role_update",
    displayName: "Cập nhật vai trò",
    description: "Cho phép chỉnh sửa vai trò",
    category: "roles",
    resource: "role",
    action: "update",
    isSystem: true,
    status: "active",
  },
  {
    name: "role_delete",
    displayName: "Xóa vai trò",
    description: "Cho phép xóa vai trò",
    category: "roles",
    resource: "role",
    action: "delete",
    isSystem: true,
    status: "active",
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
    status: "active",
  },
  {
    name: "permission_create",
    displayName: "Tạo quyền hạn",
    description: "Cho phép tạo quyền hạn mới",
    category: "permissions",
    resource: "permission",
    action: "create",
    isSystem: true,
    status: "active",
  },
  {
    name: "permission_update",
    displayName: "Cập nhật quyền hạn",
    description: "Cho phép chỉnh sửa quyền hạn",
    category: "permissions",
    resource: "permission",
    action: "update",
    isSystem: true,
    status: "active",
  },
  {
    name: "permission_delete",
    displayName: "Xóa quyền hạn",
    description: "Cho phép xóa quyền hạn",
    category: "permissions",
    resource: "permission",
    action: "delete",
    isSystem: true,
    status: "active",
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
    status: "active",
  },
  {
    name: "setting_update",
    displayName: "Cập nhật cài đặt",
    description: "Cho phép cập nhật cài đặt hệ thống",
    category: "settings",
    resource: "setting",
    action: "update",
    isSystem: true,
    status: "active",
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
    status: "active",
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
    status: "active",
  },
  {
    name: "notification_manage",
    displayName: "Quản lý thông báo",
    description: "Cho phép quản lý tất cả thông báo (admin)",
    category: "notifications",
    resource: "notification",
    action: "manage",
    isSystem: true,
    status: "active",
  },
]

// Sample Departments
const sampleDepartments = [
  {
    name: "Ban giám đốc",
    description: "Ban lãnh đạo công ty",
    code: "BGD",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "IT",
    description: "Phòng Công nghệ thông tin",
    code: "IT",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Nhân sự",
    description: "Phòng Nhân sự",
    code: "HR",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Tài chính",
    description: "Phòng Tài chính",
    code: "FIN",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Kinh doanh",
    description: "Phòng Kinh doanh",
    code: "SALES",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Marketing",
    description: "Phòng Marketing",
    code: "MKT",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Kế toán",
    description: "Phòng Kế toán",
    code: "ACC",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Sample Users (will be updated with roleId and departmentId after roles and departments are created)
const sampleUsers = [
  {
    name: "Quản trị viên",
    email: "admin@casumina.com",
    password: "admin123",
    _roleName: "admin", // Temporary field for mapping
    _departmentName: "IT", // Temporary field for mapping
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Vũ Ngọc Khoa",
    email: "khoa.vu@casumina.com",
    password: "123456",
    _roleName: "manager",
    _departmentName: "IT",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Nguyễn Văn An",
    email: "an.nguyen@casumina.com",
    password: "123456",
    _roleName: "manager",
    _departmentName: "Kinh doanh",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Trần Thị Bình",
    email: "binh.tran@casumina.com",
    password: "123456",
    _roleName: "manager",
    _departmentName: "Kế toán",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Lê Văn Cường",
    email: "cuong.le@casumina.com",
    password: "123456",
    _roleName: "manager",
    _departmentName: "Nhân sự",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Phạm Thị Dung",
    email: "dung.pham@casumina.com",
    password: "123456",
    _roleName: "employee",
    _departmentName: "Nhân sự",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Hoàng Văn Em",
    email: "em.hoang@casumina.com",
    password: "123456",
    _roleName: "employee",
    _departmentName: "IT",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Võ Thị Phương",
    email: "phuong.vo@casumina.com",
    password: "123456",
    _roleName: "manager",
    _departmentName: "Tài chính",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Đặng Văn Giang",
    email: "giang.dang@casumina.com",
    password: "123456",
    _roleName: "admin",
    _departmentName: "Ban giám đốc",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Bùi Thị Hoa",
    email: "hoa.bui@casumina.com",
    password: "123456",
    _roleName: "employee",
    _departmentName: "Marketing",
    status: "inactive",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const sampleWorkflows = [
  {
    name: "Phê duyệt tài chính",
    description: "Luồng phê duyệt cho các biểu mẫu liên quan đến tài chính và chi phí",
    steps: [
      {
        order: 1,
        _roleName: "manager", // Temporary field for mapping
        _departmentName: "Tài chính", // Temporary field for mapping
        required: true,
        _approverEmails: ["phuong.vo@casumina.com"],
      },
      {
        order: 2,
        _roleName: "admin", // Temporary field for mapping (assuming CFO is an admin)
        _departmentName: "Tài chính", // Temporary field for mapping
        required: true,
        _approverEmails: ["phuong.vo@casumina.com"],
      },
      {
        order: 3,
        _roleName: "admin", // Temporary field for mapping (assuming CEO is an admin)
        _departmentName: "Ban giám đốc", // Temporary field for mapping
        required: true,
        _approverEmails: ["giang.dang@casumina.com"],
      },
    ],
    status: "active",
    _createdByEmail: "admin@casumina.com",
    usageCount: 15,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    name: "Phê duyệt nhân sự",
    description: "Luồng phê duyệt cho các biểu mẫu liên quan đến nhân sự và tuyển dụng",
    steps: [
      {
        order: 1,
        _roleName: "manager",
        _departmentName: "Nhân sự",
        required: true,
        _approverEmails: ["cuong.le@casumina.com"],
      },
      {
        order: 2,
        _roleName: "admin", // Assuming HR Director is an admin
        _departmentName: "Nhân sự",
        required: true,
        _approverEmails: ["cuong.le@casumina.com"],
      },
    ],
    status: "active",
    _createdByEmail: "admin@casumina.com",
    usageCount: 8,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    name: "Phê duyệt IT",
    description: "Luồng phê duyệt cho yêu cầu thiết bị và dịch vụ công nghệ thông tin",
    steps: [
      {
        order: 1,
        _roleName: "manager", // IT Manager
        _departmentName: "IT",
        required: true,
        _approverEmails: ["khoa.vu@casumina.com"],
      },
      {
        order: 2,
        _roleName: "admin", // Assuming Operations Director is an admin
        _departmentName: "Ban giám đốc",
        required: true,
        _approverEmails: ["giang.dang@casumina.com"],
      },
    ],
    status: "active",
    _createdByEmail: "khoa.vu@casumina.com",
    usageCount: 12,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
  },
]

const sampleFormTemplates = [
  {
    name: "Đăng ký phòng họp",
    description: "Biểu mẫu đăng ký sử dụng phòng họp cho các cuộc họp nội bộ",
    category: "Hành chính",
    fields: [
      { label: "Tên người đăng ký", type: "text", required: true },
      {
        label: "Phòng ban",
        type: "select",
        required: true,
        options: ["IT", "Nhân sự", "Tài chính", "Kinh doanh", "Marketing", "Kế toán"],
      },
      { label: "Thời gian họp", type: "date", required: true },
      { label: "Thời gian kết thúc", type: "date", required: true },
      { label: "Số người tham gia", type: "text", required: true },
      { label: "Mục đích họp", type: "textarea", required: true },
      {
        label: "Phòng họp yêu cầu",
        type: "select",
        required: true,
        options: ["Phòng họp lớn (A101)", "Phòng họp nhỏ (A102)", "Phòng họp VIP (A201)", "Hội trường"],
      },
      { label: "Tài liệu đính kèm", type: "file", required: false },
    ],
    _workflowName: "Phê duyệt tài chính",
    status: "active",
    _createdByEmail: "admin@casumina.com",
    usageCount: 45,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    name: "Đề nghị thanh toán",
    description: "Biểu mẫu đề nghị thanh toán chi phí cho các hoạt động kinh doanh",
    category: "Tài chính",
    fields: [
      { label: "Tên người đề nghị", type: "text", required: true },
      {
        label: "Phòng ban",
        type: "select",
        required: true,
        options: ["IT", "Nhân sự", "Tài chính", "Kinh doanh", "Marketing", "Kế toán"],
      },
      {
        label: "Loại chi phí",
        type: "select",
        required: true,
        options: ["Chi phí vận hành", "Chi phí marketing", "Chi phí nhân sự", "Chi phí thiết bị", "Chi phí khác"],
      },
      { label: "Số tiền đề nghị", type: "text", required: true },
      { label: "Mục đích sử dụng", type: "textarea", required: true },
      { label: "Ngày cần thanh toán", type: "date", required: true },
      { label: "Hóa đơn/Chứng từ", type: "file", required: true },
    ],
    _workflowName: "Phê duyệt tài chính",
    status: "active",
    _createdByEmail: "admin@casumina.com",
    usageCount: 32,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
]

const sampleSettings = [
  {
    key: "system.app.name",
    value: "Hệ thống phê duyệt biểu mẫu DCG",
    type: "string",
    description: "Tên ứng dụng",
    category: "system",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "email.smtp.host",
    value: "smtp.gmail.com",
    type: "string",
    description: "SMTP server host",
    category: "email",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "system.pagination.default",
    value: 20,
    type: "number",
    description: "Số lượng item mặc định trên mỗi trang",
    category: "system",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function hashPasswords(users) {
  const hashedUsers = []
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 12)
    hashedUsers.push({
      ...user,
      password: hashedPassword,
    })
  }
  return hashedUsers
}

async function seedDatabase() {
  let client

  try {
    console.log("🔄 Đang kết nối tới MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("✅ Kết nối MongoDB thành công!")

    const db = client.db()

    // Clear existing data
    console.log("🗑️  Đang xóa dữ liệu cũ...")
    const collections = [
      "users",
      "roles",
      "permissions",
      "departments",
      "formtemplates",
      "formsubmissions",
      "workflows",
      "notifications",
      "auditlogs",
      "settings",
    ]

    for (const collection of collections) {
      await db.collection(collection).deleteMany({})
    }

    // 1. Insert Permissions
    console.log("🔐 Đang thêm quyền hạn...")
    const permissionsResult = await db.collection("permissions").insertMany(defaultPermissions)
    console.log(`✅ Đã thêm ${permissionsResult.insertedCount} quyền hạn`)

    const permissionNameToIdMap = new Map()
    Object.keys(permissionsResult.insertedIds).forEach((key) => {
      const permission = defaultPermissions[key]
      permissionNameToIdMap.set(permission.name, permissionsResult.insertedIds[key])
    })

    // 2. Create Default Roles
    console.log("👥 Đang tạo vai trò mặc định...")
    const defaultRoles = [
      {
        name: "super_admin",
        displayName: "Quản trị viên tối cao",
        description: "Có tất cả quyền hạn trong hệ thống",
        permissions: Array.from(permissionNameToIdMap.values()), // All permissions
        isSystem: true,
        level: 100,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "admin",
        displayName: "Quản trị viên",
        description: "Quản lý hệ thống và người dùng",
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
        ].map((name) => permissionNameToIdMap.get(name)),
        isSystem: true,
        level: 90,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "manager",
        displayName: "Trưởng phòng",
        description: "Quản lý các đơn gửi trong phòng ban, xem báo cáo.",
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
        ].map((name) => permissionNameToIdMap.get(name)),
        isSystem: true,
        level: 70,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "employee",
        displayName: "Nhân viên",
        description: "Gửi đơn và xem các đơn của mình.",
        permissions: [
          "dashboard_view",
          "form_template_read",
          "form_submission_submit",
          "form_submission_read_own",
          "notification_read",
        ].map((name) => permissionNameToIdMap.get(name)),
        isSystem: true,
        level: 10,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const rolesResult = await db.collection("roles").insertMany(defaultRoles)
    console.log(`✅ Đã thêm ${rolesResult.insertedCount} vai trò`)

    const roleNameToIdMap = new Map()
    Object.keys(rolesResult.insertedIds).forEach((key) => {
      const role = defaultRoles[key]
      roleNameToIdMap.set(role.name, rolesResult.insertedIds[key])
    })

    // 3. Insert Departments
    console.log("🏢 Đang thêm phòng ban...")
    const departmentsResult = await db.collection("departments").insertMany(sampleDepartments)
    console.log(`✅ Đã thêm ${departmentsResult.insertedCount} phòng ban`)

    const departmentNameToIdMap = new Map()
    Object.keys(departmentsResult.insertedIds).forEach((key) => {
      const department = sampleDepartments[key]
      departmentNameToIdMap.set(department.name, departmentsResult.insertedIds[key])
    })

    // 4. Hash passwords and insert users
    console.log("👤 Đang mã hóa mật khẩu và thêm người dùng...")
    const hashedUsers = await hashPasswords(sampleUsers)
    const usersToInsert = hashedUsers.map((user) => {
      const newUser = { ...user }
      newUser.roleId = roleNameToIdMap.get(newUser._roleName)
      delete newUser._roleName
      // Map department name to departmentId
      newUser.departmentId = departmentNameToIdMap.get(newUser._departmentName)
      delete newUser._departmentName
      return newUser
    })

    const usersResult = await db.collection("users").insertMany(usersToInsert)
    console.log(`✅ Đã thêm ${usersResult.insertedCount} người dùng`)

    const userEmailToIdMap = new Map()
    Object.keys(usersResult.insertedIds).forEach((key) => {
      const user = usersToInsert[key]
      userEmailToIdMap.set(user.email, usersResult.insertedIds[key])
    })

    // 5. Process and insert workflows
    console.log("🔄 Đang thêm luồng phê duyệt...")
    const workflowsToInsert = sampleWorkflows.map((wf) => {
      const newWf = { ...wf }
      newWf.steps = newWf.steps.map((step) => {
        const newStep = { ...step }
        // Map role name to roleId
        newStep.roleId = roleNameToIdMap.get(newStep._roleName)
        delete newStep._roleName // Remove temporary field
        // Map department name to departmentId
        newStep.departmentId = departmentNameToIdMap.get(newStep._departmentName)
        delete newStep._departmentName // Remove temporary field

        if (newStep._approverEmails) {
          newStep.approverIds = newStep._approverEmails.map((email) => userEmailToIdMap.get(email).toString())
          delete newStep._approverEmails
        }
        return newStep
      })
      newWf.createdBy = userEmailToIdMap.get(newWf._createdByEmail)
      delete newWf._createdByEmail
      return newWf
    })

    const workflowsResult = await db.collection("workflows").insertMany(workflowsToInsert)
    console.log(`✅ Đã thêm ${workflowsResult.insertedCount} luồng phê duyệt`)

    const workflowNameToIdMap = new Map()
    Object.keys(workflowsResult.insertedIds).forEach((key) => {
      const workflow = workflowsToInsert[key]
      workflowNameToIdMap.set(workflow.name, workflowsResult.insertedIds[key])
    })

    // 6. Process and insert form templates
    console.log("📋 Đang thêm biểu mẫu...")
    const formTemplatesToInsert = sampleFormTemplates.map((ft) => {
      const newFt = { ...ft }
      newFt.workflowId = workflowNameToIdMap.get(newFt._workflowName)
      newFt.createdBy = userEmailToIdMap.get(newFt._createdByEmail)
      delete newFt._workflowName
      delete newFt._createdByEmail
      return newFt
    })

    const formTemplatesResult = await db.collection("formtemplates").insertMany(formTemplatesToInsert)
    console.log(`✅ Đã thêm ${formTemplatesResult.insertedCount} biểu mẫu`)

    // 7. Insert Settings
    console.log("⚙️ Đang thêm cài đặt...")
    const settingsToInsert = sampleSettings.map((setting) => ({
      ...setting,
      updatedBy: userEmailToIdMap.get("admin@casumina.com"),
    }))

    const settingsResult = await db.collection("settings").insertMany(settingsToInsert)
    console.log(`✅ Đã thêm ${settingsResult.insertedCount} cài đặt`)

    console.log("\n🎉 Seed database hoàn thành!")
    console.log("\n📊 Tổng kết:")
    console.log(`🔐 Quyền hạn: ${permissionsResult.insertedCount}`)
    console.log(`👥 Vai trò: ${rolesResult.insertedCount}`)
    console.log(`🏢 Phòng ban: ${departmentsResult.insertedCount}`)
    console.log(`👤 Người dùng: ${usersResult.insertedCount}`)
    console.log(`📋 Biểu mẫu: ${formTemplatesResult.insertedCount}`)
    console.log(`🔄 Luồng phê duyệt: ${workflowsResult.insertedCount}`)
    console.log(`⚙️ Cài đặt: ${settingsResult.insertedCount}`)

    console.log("\n🔑 Tài khoản đăng nhập:")
    console.log("Admin: admin@casumina.com / admin123")
    console.log("IT Manager: khoa.vu@casumina.com / 123456")
    console.log("Trưởng phòng KD: an.nguyen@casumina.com / 123456")
    console.log("Kế toán trưởng: binh.tran@casumina.com / 123456")
    console.log("Trưởng phòng NS: cuong.le@casumina.com / 123456")
  } catch (error) {
    console.error("❌ Lỗi khi seed database:", error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("🔌 Đã đóng kết nối MongoDB")
    }
  }
}

// Run the seed function
seedDatabase()
