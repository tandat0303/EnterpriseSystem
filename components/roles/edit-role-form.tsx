"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ButtonLoading, LoadingCard } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"
import type { Role, Permission } from "@/types"

interface EditRoleFormProps {
  roleId: string
}

export function EditRoleForm({ roleId }: EditRoleFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    level: 1,
    permissions: [] as string[],
    status: "active",
    isSystem: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [roleData, permissionsData] = await Promise.all([
          apiClient.get<Role>(`/api/roles/${roleId}`),
          apiClient.get<Permission[]>("/api/permissions", { params: { status: "active" } }),
        ])

        setFormData({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description || "",
          level: roleData.level,
          permissions: Array.isArray(roleData.permissions) ? roleData.permissions.map((p: any) => p._id || p) : [],
          status: roleData.status,
          isSystem: roleData.isSystem,
        })

        if (Array.isArray(permissionsData)) {
          setAllPermissions(permissionsData)
        } else {
          console.error("API /api/permissions did not return an array:", permissionsData)
          setAllPermissions([])
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
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
    fetchData()
  }, [roleId, router, toast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Tên vai trò phải có ít nhất 3 ký tự."
    }
    if (!formData.displayName || formData.displayName.trim().length < 3) {
      newErrors.displayName = "Tên hiển thị vai trò phải có ít nhất 3 ký tự."
    }
    if (formData.level < 1 || formData.level > 100) {
      newErrors.level = "Cấp độ vai trò phải từ 1 đến 100."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }))
    setErrors((prev) => ({ ...prev, [id]: "" }))
  }

  const handlePermissionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
    setFormData((prev) => ({ ...prev, permissions: selectedOptions }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại các trường thông tin.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await apiClient.put(`/api/roles/${roleId}`, formData)
      toast({
        title: "Thành công",
        description: "Vai trò đã được cập nhật thành công!",
      })
      router.push("/roles")
    } catch (error: any) {
      console.error("Update role failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật vai trò.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const groupedPermissions = allPermissions.reduce(
    (acc, perm) => {
      const category = perm.category || "Khác"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(perm)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  if (isLoading) {
    return (
      <LoadingCard className="w-full max-w-2xl mx-auto h-[600px] bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </LoadingCard>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-blue-800">Chỉnh sửa vai trò</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-gray-700">Tên vai trò (Hệ thống) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="admin"
                disabled={isSaving || formData.isSystem}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="displayName" className="text-gray-700">Tên hiển thị *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Quản trị viên"
                disabled={isSaving}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-700">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả về vai trò và các quyền hạn của nó."
                disabled={isSaving}
                className="border-blue-200 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="level" className="text-gray-700">Cấp độ *</Label>
              <Input
                id="level"
                type="number"
                value={formData.level}
                onChange={handleChange}
                min={1}
                max={100}
                disabled={isSaving}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
            </div>

            <div>
              <Label htmlFor="permissions" className="text-gray-700">Quyền hạn</Label>
              <select
                id="permissions"
                multiple
                value={formData.permissions}
                onChange={handlePermissionChange}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-48"
                disabled={isSaving}
              >
                {Object.keys(groupedPermissions).length > 0 ? (
                  Object.keys(groupedPermissions).map((category) => (
                    <optgroup key={category} label={category.replace(/_/g, " ").toUpperCase()}>
                      {groupedPermissions[category].map((perm) => (
                        <option key={perm._id} value={perm._id}>
                          {perm.displayName} ({perm.name})
                        </option>
                      ))}
                    </optgroup>
                  ))
                ) : (
                  <option value="" disabled>
                    Không có quyền hạn nào để chọn.
                  </option>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">Giữ Ctrl/Cmd để chọn nhiều quyền.</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isSystem"
                checked={formData.isSystem}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isSystem: checked }))}
                disabled={isSaving || formData.isSystem}
              />
              <Label htmlFor="isSystem" className="text-gray-700">Vai trò hệ thống (Không thể xóa)</Label>
            </div>

            <div>
              <Label htmlFor="status" className="text-gray-700">Trạng thái</Label>
              <select
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              disabled={isSaving}
            >
              <ButtonLoading isLoading={isSaving} loadingText="Đang cập nhật...">
                Cập nhật vai trò
              </ButtonLoading>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}