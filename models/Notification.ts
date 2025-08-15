import { Schema, model, models } from "mongoose"

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "form_submitted",
        "approval_required",
        "form_approved",
        "form_rejected",
        "feedback_received",
        "user_assigned_role",
        "department_assigned_manager",
        "system_alert",
        "submission_pending",
        "submission_approved",
        "submission_rejected",
        "new_assignment",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedFormId: {
      type: Schema.Types.ObjectId,
      ref: "FormSubmission",
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

// Index để tối ưu truy vấn
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
notificationSchema.index({ createdAt: -1 })

export const Notification = models.Notification || model("Notification", notificationSchema)