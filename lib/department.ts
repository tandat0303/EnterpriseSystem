import { dbConnect } from "@/lib/mongodb"
import { Department } from "@/models/Department"
import mongoose from "mongoose"

interface CreateDepartmentParams {
  name: string
  description?: string
  managerId?: string
  parentDepartmentId?: string
  code?: string
}

interface UpdateDepartmentParams {
  name?: string
  description?: string
  managerId?: string
  parentDepartmentId?: string
  code?: string
  status?: "active" | "inactive"
}

export async function createDepartment({
  name,
  description,
  managerId,
  parentDepartmentId,
  code,
}: CreateDepartmentParams) {
  await dbConnect()

  const newDepartment = new Department({
    name,
    description,
    managerId: managerId ? new mongoose.Types.ObjectId(managerId) : undefined,
    parentDepartmentId: parentDepartmentId ? new mongoose.Types.ObjectId(parentDepartmentId) : undefined,
    code,
  })

  await newDepartment.save()
  return newDepartment.toObject()
}

export async function updateDepartment(id: string, updates: UpdateDepartmentParams) {
  await dbConnect()

  const updateFields: any = { ...updates }
  if (updates.managerId === "") {
    updateFields.managerId = null // Set to null if explicitly cleared
  } else if (updates.managerId) {
    updateFields.managerId = new mongoose.Types.ObjectId(updates.managerId)
  }

  if (updates.parentDepartmentId === "") {
    updateFields.parentDepartmentId = null // Set to null if explicitly cleared
  } else if (updates.parentDepartmentId) {
    updateFields.parentDepartmentId = new mongoose.Types.ObjectId(updates.parentDepartmentId)
  }

  const updatedDepartment = await Department.findByIdAndUpdate(id, updateFields, { new: true })
    .populate("managerId", "name email")
    .populate("parentDepartmentId", "name")
    .lean()

  return updatedDepartment
}

interface GetDepartmentsParams {
  includeInactive?: boolean
}

export async function getDepartments({ includeInactive = false }: GetDepartmentsParams = {}) {
  await dbConnect()
  const query: any = {}
  if (!includeInactive) {
    query.status = "active"
  }
  const departments = await Department.find(query)
    .populate("managerId", "name email")
    .populate("parentDepartmentId", "name")
    .sort({ name: 1 })
    .lean()
  return departments
}

export async function getDepartmentHierarchy() {
  await dbConnect()
  const departments = await Department.find({ status: "active" }).populate("managerId", "name email").lean()

  const departmentMap: { [key: string]: any } = {}
  departments.forEach((dept) => {
    departmentMap[dept._id.toString()] = { ...dept, children: [] }
  })

  const hierarchy: any[] = []
  departments.forEach((dept) => {
    if (dept.parentDepartmentId && departmentMap[dept.parentDepartmentId.toString()]) {
      departmentMap[dept.parentDepartmentId.toString()].children.push(departmentMap[dept._id.toString()])
    } else {
      hierarchy.push(departmentMap[dept._id.toString()])
    }
  })

  // Sort children departments by name
  const sortChildren = (nodes: any[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children)
      }
    })
  }
  sortChildren(hierarchy)

  return hierarchy
}
