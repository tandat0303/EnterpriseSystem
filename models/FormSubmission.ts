import { Schema, model, models } from "mongoose"

const approvalActionSchema = new Schema(
  {
    stepId: { type: String, required: true }, // ID của bước trong workflow
    approverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["approve", "reject", "feedback", "submitted"],
      required: true,
    },
    comment: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
)

const formSubmissionSchema = new Schema(
  {
    formTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "FormTemplate",
      required: true,
    },
    submitterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "feedback_requested"],
      default: "pending",
    },
    currentStep: {
      type: Number,
      default: 0,
    },
    approvalHistory: [approvalActionSchema],
    workflowInstance: [
      {
        stepId: { type: Schema.Types.ObjectId, ref: "WorkflowStep", required: true },
        status: { type: String, enum: ["pending", "approved", "rejected", "feedback", "completed"] },
        approverId: { type: Schema.Types.ObjectId, ref: "User" },
        approvedAt: Date,
        comments: String,
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  },
)

// Index để tối ưu truy vấn
formSubmissionSchema.index({ status: 1, formTemplateId: 1, submitterId: 1, createdAt: -1 })

export const FormSubmission = models.FormSubmission || model("FormSubmission", formSubmissionSchema)