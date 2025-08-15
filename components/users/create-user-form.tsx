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
import type { Department, Role } from "@/types"

export function CreateUserForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    departmentId: "",
    status: "active",
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true)
      try {
        const [departmentsData, rolesData] = await Promise.all([
          apiClient.get<Department[]>("/api/departments"),
          apiClient.get<Role[]>("/api/roles", { params: { status: "active" } }),
        ])

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
        console.error("Failed to fetch data:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải dữ liệu cần thiết.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingData(false)
      }
    }
    fetchData()
  }, [toast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Tên người dùng phải có ít nhất 3 ký tự."
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ."
    }
    if (!formData.password || formData.password.length < 6) {
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
      await apiClient.post("/api/users", formData)

      toast({
        title: "Thành công",
        description: "Người dùng đã được tạo thành công!",
      })
      router.push("/users")
    } catch (error: any) {
      console.error("Create user failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo người dùng.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-blue-800">Tạo người dùng mới</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <LoadingCard className="h-[400px]">
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
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  disabled={isLoading}
                  className="border-blue-200 focus:ring-blue-500"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nguyenvana@example.com"
                  disabled={isLoading}
                  className="border-blue-200 focus:ring-blue-500"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="border-blue-200 focus:ring-blue-500"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="roleId" className="text-gray-700">Vai trò</Label>
                <select
                  id="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading || isLoadingData}
                >
                  <option value="">{isLoadingData ? "Đang tải..." : "Chọn vai trò"}</option>
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
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading || isLoadingData}
                >
                  <option value="">{isLoadingData ? "Đang tải..." : "Chọn phòng ban"}</option>
                  {Array.isArray(departments) &&
                    departments.map((dept) => (
                      <option key={dept._id} value={dept._id as string}>
                        {dept.name}
                      </option>
                    ))}
                </select>
                {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                disabled={isLoading || isLoadingData}
              >
                <ButtonLoading isLoading={isLoading} loadingText="Đang tạo người dùng...">
                  Tạo người dùng
                </ButtonLoading>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}