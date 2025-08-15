import { Schema, model, models } from "mongoose"

const stepSchema = new Schema({
  order: {
    type: Number,
    required: true,
  },
  required: {
    type: Boolean,
    default: true,
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: "Department",
  },
  approverId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
})

const workflowSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    steps: [stepSchema],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

workflowSchema.index({ status: 1 })
workflowSchema.index({ createdBy: 1 })

export const Workflow = models.Workflow || model("Workflow", workflowSchema)