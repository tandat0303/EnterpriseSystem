"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, ArrowLeft } from "lucide-react"
import type { FormTemplate, Workflow, Role, FormField, Department } from "@/types"
import { LoadingCard } from "@/components/ui/loading"

interface FormDetailProps {
  formId: string
}

export function FormDetail({ formId }: FormDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<FormTemplate | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchFormAndDepartments = async () => {
      setIsLoading(true)
      try {
        const [formData, departmentsData] = await Promise.all([
          apiClient.get(`/api/forms/${formId}`),
          apiClient.get<Department[]>("/api/departments", { params: { status: "active" } }),
        ])
        setForm(formData)
        setDepartments(Array.isArray(departmentsData) ? departmentsData : [])
      } catch (error: any) {
        console.error("Error fetching form or departments:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin biểu mẫu hoặc phòng ban.",
          variant: "destructive",
        })
        router.push("/forms")
      } finally {
        setIsLoading(false)
      }
    }
    if (formId) {
      fetchFormAndDepartments()
    }
  }, [formId, router, toast])

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa biểu mẫu này? Hành động này không thể hoàn tác.")) {
      return
    }
    setIsDeleting(true)
    try {
      await apiClient.delete(`/api/forms/${formId}`)
      toast({
        title: "Thành công",
        description: "Biểu mẫu đã được xóa.",
      })
      router.push("/forms")
    } catch (error: any) {
      console.error("Error deleting form:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa biểu mẫu.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <LoadingCard className="w-full max-w-4xl mx-auto h-[600px] bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </LoadingCard>
    )
  }

  if (!form) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
        Không tìm thấy biểu mẫu.
      </div>
    )
  }

  const workflow =
    typeof form.workflowId === "object" && form.workflowId !== null ? (form.workflowId as Workflow) : null

  const categoryDisplay = departments.find((dept) => dept.name === form.category)
    ? form.category
    : "Không xác định"

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/forms")}
            className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h2 className="text-3xl font-bold text-blue-800">{form.name}</h2>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/forms/${formId}/edit`)}
            className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </div>

      <Card className="mb-6 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600">Tên biểu mẫu</p>
            <p className="text-lg text-gray-800">{form.name}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Mô tả</p>
            <p className="text-gray-700">{form.description || "Không có mô tả."}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Danh mục</p>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200">
              {categoryDisplay}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">Trường dữ liệu</CardTitle>
        </CardHeader>
        <CardContent>
          {form.fields && form.fields.length > 0 ? (
            <div className="space-y-4">
              {form.fields.map((field: FormField, index: number) => (
                <div key={field.id} className="p-4 border border-blue-200 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-600">Trường {index + 1}: {field.label}</p>
                    <Badge
                      variant={field.required ? "default" : "outline"}
                      className={field.required ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-600 border-blue-200"}
                    >
                      {field.required ? "Bắt buộc" : "Tùy chọn"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Loại: {getFieldTypeLabel(field.type)}</p>
                  {field.type === "select" && field.options && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Tùy chọn:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {field.options.map((option, idx) => (
                          <li key={idx}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Không có trường dữ liệu nào.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">Luồng phê duyệt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600">Tên luồng</p>
            <p className="text-lg text-gray-800">{workflow ? workflow.name : "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Mô tả</p>
            <p className="text-gray-700">{workflow ? workflow.description : "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Các bước phê duyệt</p>
            {workflow && workflow.steps && workflow.steps.length > 0 ? (
              <div className="space-y-2 mt-2">
                {workflow.steps.map((step, index) => (
                  <div key={index} className="text-sm bg-blue-50 p-3 rounded-lg">
                    <span className="font-medium">Bước {index + 1}:</span>{" "}
                    {(step.roleId as Role)?.displayName || "N/A"}
                    {step.approverId && (
                      <span className="ml-2 text-gray-500">
                        (Người phê duyệt: {(step.approverId as any)?.name || step.approverId})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Không có bước phê duyệt nào.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800">Thông tin khác</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600">Ngày tạo</p>
            <p className="text-sm text-gray-800">{new Date(form.createdAt).toLocaleString("vi-VN")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Ngày cập nhật</p>
            <p className="text-sm text-gray-800">{new Date(form.updatedAt).toLocaleString("vi-VN")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Người tạo</p>
            <p className="text-sm text-gray-800">{(form.createdBy as any)?.name || (form.createdBy as any)?._id || "N/A"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getFieldTypeLabel(type: string): string {
  switch (type) {
    case "text":
      return "Văn bản"
    case "textarea":
      return "Văn bản dài"
    case "select":
      return "Lựa chọn"
    case "date":
      return "Ngày tháng"
    case "file":
      return "Tệp đính kèm"
    case "number":
      return "Số"
    default:
      return "Không xác định"
  }
}