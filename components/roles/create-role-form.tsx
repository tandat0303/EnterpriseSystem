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
import { ButtonLoading } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"
import type { Permission } from "@/types"

export function CreateRoleForm() {
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    level: 1,
    permissions: [] as string[],
    status: "active",
    isSystem: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchPermissions = async () => {
      setIsLoadingPermissions(true)
      try {
        const data: Permission[] = await apiClient.get("/api/permissions", { params: { status: "active" } })
        if (Array.isArray(data)) {
          setAllPermissions(data)
        } else {
          console.error("API /api/permissions did not return an array:", data)
          setAllPermissions([])
        }
      } catch (error: any) {
        console.error("Failed to fetch permissions:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách quyền hạn.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingPermissions(false)
      }
    }
    fetchPermissions()
  }, [toast])

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

    setIsLoading(true)
    try {
      await apiClient.post("/api/roles", formData)
      toast({
        title: "Thành công",
        description: "Vai trò đã được tạo thành công!",
      })
      router.push("/roles")
    } catch (error: any) {
      console.error("Create role failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo vai trò.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-blue-800">Tạo vai trò mới</CardTitle>
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading || isLoadingPermissions}
              >
                {isLoadingPermissions ? (
                  <option value="" disabled>
                    Đang tải quyền hạn...
                  </option>
                ) : Object.keys(groupedPermissions).length > 0 ? (
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
                disabled={isLoading}
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
                disabled={isLoading}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              disabled={isLoading || isLoadingPermissions}
            >
              <ButtonLoading isLoading={isLoading} loadingText="Đang tạo vai trò...">
                Tạo vai trò
              </ButtonLoading>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}