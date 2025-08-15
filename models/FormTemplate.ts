import { Schema, model, models } from "mongoose"

const formFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "textarea", "select", "date", "file", "number", "checkbox", "radio"],
      required: true,
    },
    required: { type: Boolean, default: false },
    options: [{ type: String }], // For select, radio, checkbox
    validation: {
      minLength: Number,
      maxLength: Number,
      pattern: String,
    },
  },
  { _id: false }, // Không tạo _id cho sub-document này
)

const formTemplateSchema = new Schema(
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
    category: {
      type: String,
      trim: true,
    },
    fields: [formFieldSchema],
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "draft", "inactive"],
      default: "active",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

export const FormTemplate = models.FormTemplate || model("FormTemplate", formTemplateSchema)
