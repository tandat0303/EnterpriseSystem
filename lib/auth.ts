import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { dbConnect } from "@/lib/mongodb"
import { User } from "@/models/User"
import { Role } from "@/models/Role"
import { Permission } from "@/models/Permission"

interface JwtPayload {
  userId: string
  email: string
  name: string
  roleId: string | null
  roleName: string | null
  permissions: string[]
}

export async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = request.headers.get("Authorization")?.split(" ")[1] || cookies().get("token")?.value

  if (!token) {
    return null
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.")
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload
    return decoded.userId
  } catch (error) {
    console.error("Error verifying JWT token:", error)
    return null
  }
}

export async function verifySession(request: NextRequest): Promise<JwtPayload | null> {
  const token = request.headers.get("Authorization")?.split(" ")[1] || cookies().get("token")?.value

  if (!token) {
    return null
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.")
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload

    // Re-fetch user and role/permissions to ensure data is up-to-date
    await dbConnect()
    const user = await User.findById(decoded.userId)
      .populate({
        path: "roleId",
        model: Role,
        populate: {
          path: "permissions",
          model: Permission,
        },
      })
      .lean()

    if (!user || user.status === "inactive") {
      return null // User not found or inactive
    }

    const userPermissions: string[] = []
    if (user.roleId && user.roleId.permissions) {
      user.roleId.permissions.forEach((perm: any) => {
        if (perm.name) {
          userPermissions.push(perm.name)
        }
      })
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      roleId: user.roleId ? user.roleId._id.toString() : null,
      roleName: user.roleId ? user.roleId.name : null,
      permissions: userPermissions,
    } as JwtPayload
  } catch (error) {
    console.error("Error verifying session:", error)
    return null
  }
}
