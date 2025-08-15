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
import { ButtonLoading } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"
import type { Department } from "@/types"

export function CreateDepartmentForm() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
    code: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [departments, setDepartments] = useState<Department[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const deptData = await apiClient.get<Department[]>("/api/departments")
        if (Array.isArray(deptData)) {
          setDepartments(deptData)
        } else {
          console.error("API /api/departments did not return an array:", deptData)
          setDepartments([])
        }
      } catch (error: any) {
        console.error("Error loading departments:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải dữ liệu phòng ban.",
          variant: "destructive",
        })
      }
    }
    loadDepartments()
  }, [toast])

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

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        managerId: formData.managerId || undefined,
        code: formData.code || undefined,
      }

      await apiClient.post("/api/departments", payload)

      toast({
        title: "Thành công",
        description: "Phòng ban đã được tạo thành công!",
      })
      router.push("/departments")
    } catch (error: any) {
      console.error("Create department failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo phòng ban.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-50 to-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-800">Thông tin phòng ban</CardTitle>
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
              disabled={isLoading}
              className="border-blue-200 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="code" className="text-gray-700">Mã phòng ban</Label>
            <Input id="code" value={formData.code} onChange={handleChange} placeholder="HR" disabled={isLoading} className="border-blue-200 focus:ring-blue-500" />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả về chức năng và nhiệm vụ của phòng ban"
              disabled={isLoading}
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
              disabled={isLoading}
            >
              <option value="">Phòng ban chưa được tạo</option>
            </select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200" disabled={isLoading}>
            <ButtonLoading isLoading={isLoading} loadingText="Đang tạo phòng ban...">
              Tạo phòng ban
            </ButtonLoading>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}