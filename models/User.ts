import { Schema, model, models } from "mongoose"

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId, // Now stores ObjectId
      ref: "Department", // References the Department model
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

export const User = models.User || model("User", userSchema)
