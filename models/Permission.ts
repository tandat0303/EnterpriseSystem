import { Schema, model, models } from "mongoose"

const permissionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "dashboard",
        "forms",
        "submissions",
        "workflows",
        "users",
        "departments",
        "settings",
        "reports",
        "system",
        "notifications",
        "audit_logs",
      ],
      required: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      enum: ["create", "read", "update", "delete", "approve", "manage", "view", "submit"],
      required: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

export const Permission = models.Permission || model("Permission", permissionSchema)
