"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ButtonLoading } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"

export function CreatePermissionForm() {
  const [formData, setFormData] = useState({
    displayName: "",
    name: "",
    description: "",
    category: "",
    resource: "",
    action: "",
    status: "active",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const router = useRouter()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.displayName || formData.displayName.trim().length < 2) {
      newErrors.displayName = "Tên hiển thị phải có ít nhất 2 ký tự."
    }
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Tên hệ thống phải có ít nhất 2 ký tự."
    }
    if (!formData.category) {
      newErrors.category = "Danh mục không được để trống."
    }
    if (!formData.resource) {
      newErrors.resource = "Tài nguyên không được để trống."
    }
    if (!formData.action) {
      newErrors.action = "Hành động không được để trống."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => ({ ...prev, [id]: "" }))
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
      await apiClient.post("/api/permissions", formData)

      toast({
        title: "Thành công",
        description: "Quyền hạn đã được tạo thành công!",
      })
      router.push("/permissions")
    } catch (error: any) {
      console.error("Create permission failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo quyền hạn.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-50 to-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-800">Tạo quyền hạn mới</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="displayName" className="text-gray-700">Tên hiển thị *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Quản lý người dùng"
              disabled={isSaving}
              className="border-blue-200 focus:ring-blue-500"
            />
            {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
          </div>

          <div>
            <Label htmlFor="name" className="text-gray-700">Tên hệ thống *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="manage_users"
              disabled={isSaving}
              className="border-blue-200 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="category" className="text-gray-700">Danh mục *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Hệ thống"
              disabled={isSaving}
              className="border-blue-200 focus:ring-blue-500"
            />
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <Label htmlFor="resource" className="text-gray-700">Tài nguyên *</Label>
            <Input
              id="resource"
              value={formData.resource}
              onChange={handleChange}
              placeholder="users"
              disabled={isSaving}
              className="border-blue-200 focus:ring-blue-500"
            />
            {errors.resource && <p className="text-red-500 text-sm mt-1">{errors.resource}</p>}
          </div>

          <div>
            <Label htmlFor="action" className="text-gray-700">Hành động *</Label>
            <Input
              id="action"
              value={formData.action}
              onChange={handleChange}
              placeholder="manage"
              disabled={isSaving}
              className="border-blue-200 focus:ring-blue-500"
            />
            {errors.action && <p className="text-red-500 text-sm mt-1">{errors.action}</p>}
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả về quyền hạn này"
              disabled={isSaving}
              className="border-blue-200 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="status" className="text-gray-700">Trạng thái</Label>
            <select
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              disabled={isSaving}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200" disabled={isSaving}>
            <ButtonLoading isLoading={isSaving} loadingText="Đang tạo quyền hạn...">
              Tạo quyền hạn
            </ButtonLoading>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}