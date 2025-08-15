"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { LoadingCard } from "@/components/ui/loading"
import type { Permission } from "@/types"

interface PermissionDetailProps {
  permissionId: string
}

export function PermissionDetail({ permissionId }: PermissionDetailProps) {
  const [permission, setPermission] = useState<Permission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const fetchPermission = async () => {
    setIsLoading(true)
    try {
      const data: Permission = await apiClient.get(`/api/permissions/${permissionId}`)
      setPermission(data)
    } catch (error: any) {
      console.error("Error fetching permission:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin quyền hạn.",
        variant: "destructive",
      })
      router.push("/permissions")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPermission()
  }, [permissionId])

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    active: "Hoạt động",
    inactive: "Không hoạt động",
  }

  if (isLoading) {
    return (
      <LoadingCard className="w-full max-w-2xl mx-auto h-[400px] bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </LoadingCard>
    )
  }

  if (!permission) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
        Không tìm thấy thông tin quyền hạn.
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/permissions")}
            className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-blue-800">{permission.displayName}</h1>
            <p className="text-gray-600">Chi tiết quyền hạn</p>
          </div>
        </div>
        <Badge className={`${statusColors[permission.status as keyof typeof statusColors]} hover:bg-opacity-80 transition-colors duration-200`}>
          {statusLabels[permission.status as keyof typeof statusLabels]}
        </Badge>
      </div>

      <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Lock className="h-5 w-5 mr-2" />
            Thông tin quyền hạn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Tên hệ thống:</span>
              <p className="text-sm text-gray-800">{permission.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Danh mục:</span>
              <p className="text-sm text-gray-800">{permission.category}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Tài nguyên:</span>
              <p className="text-sm text-gray-800">{permission.resource}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Hành động:</span>
              <p className="text-sm text-gray-800">{permission.action}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Ngày tạo:</span>
              <p className="text-sm text-gray-800">{new Date(permission.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Ngày cập nhật:</span>
              <p className="text-sm text-gray-800">{new Date(permission.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Mô tả:</span>
            <p className="text-sm text-gray-800">{permission.description || "Không có mô tả"}</p>
          </div>
          <div className="pt-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              onClick={() => router.push(`/permissions/${permission._id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}