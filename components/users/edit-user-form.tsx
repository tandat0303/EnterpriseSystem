"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ButtonLoading, LoadingCard } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"
import type { User, Department, Role } from "@/types"

interface EditUserFormProps {
  userId: string
}

export function EditUserForm({ userId }: EditUserFormProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    name: "",
    email: "",
    roleId: "",
    departmentId: "",
    status: "active",
  })
  const [password, setPassword] = useState("")
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [userData, departmentsData, rolesData] = await Promise.all([
          apiClient.get<User>(`/api/users/${userId}`),
          apiClient.get<Department[]>("/api/departments"),
          apiClient.get<Role[]>("/api/roles", { params: { status: "active" } }),
        ])

        setFormData({
          name: userData.name,
          email: userData.email,
          roleId: typeof userData.roleId === "string" ? userData.roleId : (userData.roleId as Role)?._id,
          departmentId:
            typeof userData.departmentId === "string"
              ? userData.departmentId
              : (userData.departmentId as Department)?._id,
          status: userData.status,
        })

        if (Array.isArray(departmentsData)) {
          setDepartments(departmentsData)
        } else {
          console.error("API /api/departments did not return an array:", departmentsData)
          setDepartments([])
        }

        if (Array.isArray(rolesData)) {
          setRoles(rolesData)
        } else {
          console.error("API /api/roles did not return an array:", rolesData)
          setRoles([])
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
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
    fetchData()
  }, [userId, router, toast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name || (formData.name as string).trim().length < 3) {
      newErrors.name = "Tên người dùng phải có ít nhất 3 ký tự."
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email as string)) {
      newErrors.email = "Email không hợp lệ."
    }
    if (password && password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự."
    }
    if (!formData.roleId) {
      newErrors.roleId = "Vui lòng chọn vai trò."
    }
    if (!formData.departmentId) {
      newErrors.departmentId = "Vui lòng chọn phòng ban."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => ({ ...prev, [id]: "" }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setErrors((prev) => ({ ...prev, password: "" }))
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
      const payload: Partial<User> & { password?: string } = { ...formData }
      if (password) {
        payload.password = password
      }

      await apiClient.put(`/api/users/${userId}`, payload)

      toast({
        title: "Thành công",
        description: "Người dùng đã được cập nhật thành công!",
      })
      router.push(`/users/${userId}`)
    } catch (error: any) {
      console.error("Update user failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật người dùng.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-blue-800">Chỉnh sửa thông tin người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCard className="h-[600px]">
              <div className="space-y-6">
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </LoadingCard>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-gray-700">Tên người dùng</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  disabled={isSaving}
                  className="border-blue-200 focus:ring-blue-500"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="nguyenvana@example.com"
                  disabled={isSaving}
                  className="border-blue-200 focus:ring-blue-500"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700">Mật khẩu (Để trống nếu không đổi)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  disabled={isSaving}
                  className="border-blue-200 focus:ring-blue-500"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="roleId" className="text-gray-700">Vai trò</Label>
                <select
                  id="roleId"
                  value={formData.roleId || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving}
                >
                  <option value="">Chọn vai trò</option>
                  {Array.isArray(roles) &&
                    roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.displayName} (Cấp {role.level})
                      </option>
                    ))}
                </select>
                {errors.roleId && <p className="text-red-500 text-sm mt-1">{errors.roleId}</p>}
              </div>
              <div>
                <Label htmlFor="departmentId" className="text-gray-700">Phòng ban</Label>
                <select
                  id="departmentId"
                  value={formData.departmentId || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving}
                >
                  <option value="">Chọn phòng ban</option>
                  {Array.isArray(departments) &&
                    departments.map((dept) => (
                      <option key={dept._id} value={dept._id as string}>
                        {dept.name}
                      </option>
                    ))}
                </select>
                {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>}
              </div>
              <div>
                <Label htmlFor="status" className="text-gray-700">Trạng thái</Label>
                <select
                  id="status"
                  value={formData.status || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
                {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                disabled={isSaving}
              >
                <ButtonLoading isLoading={isSaving} loadingText="Đang cập nhật...">
                  Cập nhật người dùng
                </ButtonLoading>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}