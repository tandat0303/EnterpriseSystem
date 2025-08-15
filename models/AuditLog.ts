import { Schema, model, models } from "mongoose"

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete", "approve", "reject", "submit", "login", "logout"],
      required: true,
    },
    resourceType: {
      type: String,
      enum: [
        "FormTemplate",
        "FormSubmission",
        "User",
        "Workflow",
        "Department",
        "Setting",
        "Role",
        "Permission",
        "System",
      ],
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    oldData: {
      type: Schema.Types.Mixed,
    },
    newData: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes để tối ưu truy vấn
auditLogSchema.index({ userId: 1, createdAt: -1 })
auditLogSchema.index({ resourceType: 1, resourceId: 1 })
auditLogSchema.index({ action: 1, createdAt: -1 })
auditLogSchema.index({ createdAt: -1 })

export const AuditLog = models.AuditLog || model("AuditLog", auditLogSchema)
