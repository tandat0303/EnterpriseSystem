import { Schema, model, models } from "mongoose"

const settingSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ["string", "number", "boolean", "object", "array"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["email", "system", "security", "ui", "workflow", "notification"],
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

export const Setting = models.Setting || model("Setting", settingSchema)
