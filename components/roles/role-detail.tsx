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
import type { Role, User } from "@/types"

interface RoleDetailProps {
  roleId: string
}

export function RoleDetail({ roleId }: RoleDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      setIsLoading(true)
      try {
        const data: Role = await apiClient.get(`/api/roles/${roleId}`)
        setRole(data)
      } catch (error: any) {
        console.error("Error fetching role:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin vai trò.",
          variant: "destructive",
        })
        router.push("/roles")
      } finally {
        setIsLoading(false)
      }
    }
    fetchRole()
  }, [roleId, router, toast])

  if (isLoading) {
    return (
      <LoadingCard className="w-full max-w-2xl mx-auto h-[600px] bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </LoadingCard>
    )
  }

  if (!role) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
        Không tìm thấy vai trò.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/roles")}
            className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h2 className="text-3xl font-bold text-blue-800">{role.displayName}</h2>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600">Tên hệ thống</p>
            <p className="text-lg text-gray-800">{role.name}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Mô tả</p>
            <p className="text-gray-700">{role.description || "Không có mô tả"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Cấp độ</p>
            <p className="text-gray-800">{role.level}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Trạng thái</p>
            <Badge
              className={`${
                role.status === "active"
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              } transition-colors duration-200`}
            >
              {role.status === "active" ? "Hoạt động" : "Không hoạt động"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Vai trò hệ thống</p>
            <p className="text-gray-800">{role.isSystem ? "Có" : "Không"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Ngày tạo</p>
            <p className="text-gray-800">{new Date(role.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Cập nhật cuối</p>
            <p className="text-gray-800">{new Date(role.updatedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Người tạo</p>
            <p className="text-gray-800">{(role.createdBy as User)?.name || "N/A"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">Quyền hạn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
              role.permissions.map((permission: any) => (
                <Badge key={permission._id} variant="secondary" className="text-xs">
                  {permission.displayName} ({permission.name})
                </Badge>
              ))
            ) : (
              <p className="text-sm text-gray-500">Không có quyền hạn nào được gán.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}