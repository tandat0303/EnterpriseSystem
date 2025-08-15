"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ButtonLoading, LoadingCard } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"
import type { Department, User } from "@/types"

interface EditDepartmentFormProps {
  departmentId: string
}

export function EditDepartmentForm({ departmentId }: EditDepartmentFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
    code: "",
    status: "active",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [users, setUsers] = useState<User[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const currentDept = await apiClient.get<Department>(`/api/departments/${departmentId}`)
        setFormData({
          name: currentDept.name || "",
          description: currentDept.description || "",
          managerId: (currentDept.managerId as any)?._id || currentDept.managerId || "",
          code: currentDept.code || "",
          status: currentDept.status || "active",
        })

        setIsLoadingUsers(true)
        try {
          const usersData = await apiClient.get<User[]>("/api/users", {
            params: { departmentId },
          })
          if (Array.isArray(usersData)) {
            setUsers(usersData)
          } else {
            console.error("API /api/users did not return an array:", usersData)
            setUsers([])
          }
        } catch (error: any) {
          console.error("Error loading users:", error)
          toast({
            title: "Lỗi",
            description: error.message || "Không thể tải danh sách người dùng.",
            variant: "destructive",
          })
          setUsers([])
        } finally {
          setIsLoadingUsers(false)
        }
      } catch (error: any) {
        console.error("Error loading data:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin phòng ban.",
          variant: "destructive",
        })
        router.push("/departments")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [departmentId, router, toast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Tên phòng ban phải có ít nhất 2 ký tự."
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
      const payload = {
        ...formData,
        managerId: formData.managerId || undefined,
        code: formData.code || undefined,
      }

      await apiClient.put(`/api/departments/${departmentId}`, payload)

      toast({
        title: "Thành công",
        description: "Phòng ban đã được cập nhật thành công!",
      })
      router.push("/departments")
    } catch (error: any) {
      console.error("Update department failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật phòng ban.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <LoadingCard className="w-full max-w-2xl mx-auto h-[500px] bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </LoadingCard>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-50 to-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-800">Chỉnh sửa thông tin phòng ban</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-gray-700">Tên phòng ban *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Phòng Nhân sự"
              disabled={isSaving}
              className="border-blue-200 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="code" className="text-gray-700">Mã phòng ban</Label>
            <Input id="code" value={formData.code} onChange={handleChange} placeholder="HR" disabled={isSaving} className="border-blue-200 focus:ring-blue-500" />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả về chức năng và nhiệm vụ của phòng ban"
              disabled={isSaving}
              className="border-blue-200 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="managerId" className="text-gray-700">Trưởng phòng</Label>
            <select
              id="managerId"
              value={formData.managerId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              disabled={isSaving || isLoadingUsers}
            >
              <option value="">
                {isLoadingUsers
                  ? "Đang tải người dùng..."
                  : users.length
                  ? "Chọn trưởng phòng"
                  : "Không có người dùng trong phòng ban này"}
              </option>
              {Array.isArray(users) &&
                users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.email}
                  </option>
                ))}
            </select>
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
            <ButtonLoading isLoading={isSaving} loadingText="Đang cập nhật...">
              Cập nhật phòng ban
            </ButtonLoading>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}