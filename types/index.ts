import type { Types } from "mongoose"
import type { LucideIcon } from "lucide-react"

export interface User {
  _id: Types.ObjectId | string
  id?: string // For client-side consistency
  name: string
  email: string
  password?: string
  roleId: Types.ObjectId | string // Reference to Role model
  departmentId?: Types.ObjectId | string // Reference to Department model
  permissions: string[] // Array of permission slugs
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Role {
  _id: Types.ObjectId | string
  name: string // Unique name, e.g., "admin", "user", "approver"
  displayName: string // Display name, e.g., "Administrator", "Standard User"
  description?: string
  permissions: string[] // Array of permission slugs associated with this role
  status: "active" | "inactive"
  createdBy?: Types.ObjectId | string | User // ObjectId of User, populate to User object
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  _id: Types.ObjectId | string
  name: string // Unique slug, e.g., "user.create", "form.edit"
  displayName: string // Human-readable name, e.g., "Create User", "Edit Form"
  description?: string
  resource: string
  isSystem: boolean
  action: "create" | "read" | "update" | "delete" | "approve" | "manage" | "view" | "submit"
  category: string // e.g., "users", "forms", "workflows"
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

export interface Department {
  _id: Types.ObjectId | string
  name: string
  description?: string
  managerId?: Types.ObjectId | string | User // ObjectId of User, populate to User object
  parentDepartmentId?: Types.ObjectId | string | Department // ObjectId of Department, populate to Department object
  status: "active" | "inactive"
  code?: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowStep {
  _id?: Types.ObjectId | string
  roleId: Types.ObjectId | string | Role // Reference to Role model
  order: number
  required: boolean
  approverId?: (Types.ObjectId | string | User) // Array of User ObjectIds, populate to User objects
  departmentId?: Types.ObjectId | string | Department;
}

export interface Workflow {
  _id: Types.ObjectId | string
  name: string
  description?: string
  steps: WorkflowStep[]
  status: "active" | "inactive" | "draft"
  createdBy?: Types.ObjectId | string | User // ObjectId of User, populate to User object
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export type FormFieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "radio" | "file"

export interface FormFieldOption {
  label: string
  value: string
}

export interface FormField {
  id: string // Unique ID for the field
  name: string // Programmatic name (e.g., "fullName", "meetingDate")
  label: string // Display label (e.g., "Họ và tên", "Ngày họp")
  type: FormFieldType
  placeholder?: string
  required?: boolean
  options?: FormFieldOption[] // For select, checkbox, radio
  defaultValue?: string | number | boolean
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string // Regex string
  }
}

export interface FormTemplate {
  _id: Types.ObjectId | string
  name: string
  description?: string
  category: string
  fields: FormField[] // Array of form fields
  workflowId?: Types.ObjectId | string | Workflow // ObjectId of Workflow, populate to Workflow object
  status: "active" | "draft" | "inactive"
  createdBy: Types.ObjectId | string | User // ObjectId of User, populate to User object
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface FormSubmission {
  _id: Types.ObjectId | string
  formTemplateId: Types.ObjectId | string | FormTemplate // ObjectId of FormTemplate, populate to FormTemplate object
  submitterId: Types.ObjectId | string | User // ObjectId of User, populate to User object
  formData: Record<string, any> // Flexible object for form data
  status: "pending" | "approved" | "rejected" | "draft"
  currentStep: number // Index of the current step in the workflow
  approvalHistory: {
    approverId: Types.ObjectId | string | User // ObjectId of User, populate to User object
    status: "approved" | "rejected" | "pending"
    comment?: string
    approvedAt?: Date
  }[]
  priority: "low" | "medium" | "high"
  createdAt: Date
  updatedAt: Date
  submittedBy: string // User ID
  data: Record<string, any>
  workflowInstance: WorkflowInstanceStep[]
}

export interface WorkflowInstanceStep {
  stepId: string
  status: "pending" | "approved" | "rejected" | "feedback" | "completed"
  approverId?: string // User ID who approved/rejected
  approvedAt?: string
  comments?: string
}

export interface Notification {
  _id: Types.ObjectId | string
  userId: Types.ObjectId | string | User // User who receives the notification
  type: "form_submitted" | "approval_required" | "form_approved" | "form_rejected" | "feedback_received" | "user_assigned_role" | "department_assigned_manager" | "system_alert" | "submission_pending" | "submission_approved" | "submission_rejected" | "new_assignment"
  title: string
  message: string
  read: boolean
  entityId?: Types.ObjectId | string // ID of the related entity (e.g., submission ID, form ID)
  relatedFormId?: Types.ObjectId | string | FormTemplate // ObjectId of FormSubmission, populate to FormSubmission object
  createdAt: Date
  updatedAt: Date
  link?: string
}

export interface AuditLog {
  _id: Types.ObjectId | string
  userId?: Types.ObjectId | string
  action: string
  resourceType: string
  resourceId?: Types.ObjectId | string
  timestamp: Date
  details?: Record<string, any>
  description?: string
  ipAddress?: string
  userAgent?: string
  oldData?: Record<string, any>
  newData?: Record<string, any>
  entityType: string
}

export interface Setting {
  _id: Types.ObjectId | string
  key: string
  value: any
  type: "string" | "number" | "boolean" | "json"
  description?: string
  category: string
  isPublic: boolean
  updatedBy?: Types.ObjectId | string | User // ObjectId of User, populate to User object
  createdAt: Date
  updatedAt: Date
  displayName?: string // Added for UI display
}

export interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  icon?: LucideIcon
  label?: string
  description?: string
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[]
}

export interface NavItemWithProps extends NavItem {
  items: NavItemWithChildren[]
  permission?: string // Add permission property
}

export interface SidebarNavItem extends NavItemWithChildren {}

export interface RefreshToken {
  _id: Types.ObjectId | string;
  token: string;
  userId: Types.ObjectId | string | User;
  expiresAt: Date;
  createdAt: Date;
}