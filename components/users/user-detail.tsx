"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { LoadingCard } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"
import type { User, Role, Department } from "@/types"

interface UserDetailProps {
  userId: string
}

export function UserDetail({ userId }: UserDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        const data: User = await apiClient.get(`/api/users/${userId}`)
        setUser(data)
      } catch (error: any) {
        console.error("Error fetching user:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin người dùng.",
          variant: "destructive",
        })
        router.push("/users")
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [userId, router, toast])

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <LoadingCard className="h-[600px]">
          <div className="space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </LoadingCard>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <div className="text-center py-12 text-gray-500">Không tìm thấy người dùng.</div>
      </div>
    )
  }

  const userPermissions = Array.isArray(user.permissions) ? user.permissions : []

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/users")}
            className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h2 className="text-3xl font-bold text-blue-800">{user.name}</h2>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600">Email</p>
            <p className="text-gray-800">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Trạng thái</p>
            <Badge
              className={`${
                user.status === "active"
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              } transition-colors duration-200`}
            >
              {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Phòng ban</p>
            <p className="text-gray-800">
              {typeof user.departmentId === "object" && user.departmentId !== null
                ? (user.departmentId as Department).name
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Vai trò</p>
            <p className="text-gray-800">
              {typeof user.roleId === "object" && user.roleId !== null
                ? (user.roleId as Role).displayName
                : user.role || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Ngày tạo</p>
            <p className="text-gray-800">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Cập nhật cuối</p>
            <p className="text-gray-800">{new Date(user.updatedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Đăng nhập cuối</p>
            <p className="text-gray-800">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Chưa bao giờ"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">Quyền hạn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {userPermissions.length > 0 ? (
              userPermissions.map((permissionName, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {permissionName}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-gray-500">Không có quyền hạn nào được gán trực tiếp.</p>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">Quyền hạn được kế thừa từ vai trò của người dùng.</p>
        </CardContent>
      </Card>
    </div>
  )
}