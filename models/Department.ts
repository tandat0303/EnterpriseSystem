import { Schema, model, models } from "mongoose"

const departmentSchema = new Schema(
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
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    parentDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index để tối ưu truy vấn
departmentSchema.index({ status: 1 })
departmentSchema.index({ parentDepartmentId: 1 })

export const Department = models.Department || model("Department", departmentSchema)
