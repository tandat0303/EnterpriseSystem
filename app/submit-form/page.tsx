"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormRenderer } from "@/components/forms/form-renderer"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { apiClient } from "@/lib/api-client"
import type { FormTemplate, FormFieldOption } from "@/types"
import { Label } from "@/components/ui/label"

export default function SubmitFormPage() {
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [priority, setPriority] = useState<string>("medium") // Mặc định là "Trung bình"
  const [priorityError, setPriorityError] = useState<string>("")
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const renderCount = useRef(0)

  // Log số lần render
  useEffect(() => {
    renderCount.current += 1
    console.log(`SubmitFormPage render count: ${renderCount.current}`)
    if (renderCount.current > 100) {
      console.error("Possible infinite render loop detected!")
    }
  })

  const stableFormTemplates = useMemo(() => {
    const cleanedTemplates = formTemplates.map((template) => ({
      ...template,
      fields: (template.fields ?? []).map((field) => ({
        ...field,
        options: field.type === "select"
          ? (field.options ?? []).map((opt) =>
              typeof opt === "string" ? opt : (opt as FormFieldOption).value
            ).filter((opt) => opt != null && typeof opt === "string" && opt.trim() !== "")
          : field.options,
      })),
    }))
    console.log("Stable formTemplates:", JSON.stringify(cleanedTemplates, null, 2))
    return cleanedTemplates
  }, [formTemplates])

  const stableFields = useMemo(() => {
    const fields = selectedTemplate?.fields ?? []
    console.log("Stable fields for FormRenderer:", JSON.stringify(fields, null, 2))
    return fields
  }, [selectedTemplate?.fields])

  useEffect(() => {
    const fetchFormTemplates = async () => {
      setIsLoadingTemplates(true)
      try {
        const data: FormTemplate[] = await apiClient.get("/api/forms?status=active")
        console.log("Fetched templates:", JSON.stringify(data, null, 2))
        const uniqueIds = new Set(data.map((t) => t._id))
        if (uniqueIds.size !== data.length) {
          console.error("Duplicate _id detected in formTemplates:", data)
        }
        setFormTemplates(data)
      } catch (error: any) {
        console.error("Error fetching form templates:", error)
        toast({
          title: "Lỗi",
          description: error.response?.status === 401
            ? "Không có quyền truy cập. Vui lòng đăng nhập lại."
            : error.message || "Không thể tải danh sách biểu mẫu.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingTemplates(false)
      }
    }
    fetchFormTemplates()
  }, [toast])

  useEffect(() => {
    console.log("useEffect for selectedTemplateId:", { selectedTemplateId })
    if (selectedTemplateId) {
      const template = stableFormTemplates.find((t) => t._id === selectedTemplateId)
      if (template && template._id !== selectedTemplate?._id) {
        console.log("Updating selectedTemplate:", template)
        setSelectedTemplate(template)
        setPriority("medium") // Đặt lại priority khi chọn biểu mẫu mới
        setPriorityError("") // Xóa lỗi priority khi chọn biểu mẫu mới
      }
    } else if (selectedTemplate !== null) {
      console.log("Clearing selectedTemplate")
      setSelectedTemplate(null)
      setPriority("medium")
      setPriorityError("")
    }
  }, [selectedTemplateId, stableFormTemplates, selectedTemplate?._id])

  const handleSelectChange = (value: string) => {
    console.log("Select changed:", { value, current: selectedTemplateId })
    if (value && value !== selectedTemplateId && stableFormTemplates.some((t) => t._id === value)) {
      setSelectedTemplateId(value)
    }
  }

  const handlePriorityChange = (value: string) => {
    setPriority(value)
    if (value) {
      setPriorityError("")
    }
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!selectedTemplateId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn một biểu mẫu để gửi.",
        variant: "destructive",
      })
      return
    }

    if (!user?._id) {
      toast({
        title: "Lỗi",
        description: "Không thể xác định người dùng. Vui lòng đăng nhập lại.",
        variant: "destructive",
      })
      return
    }

    // Validate priority
    if (!priority || !["low", "medium", "high"].includes(priority)) {
      setPriorityError("Vui lòng chọn mức độ ưu tiên hợp lệ.")
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn mức độ ưu tiên hợp lệ.",
        variant: "destructive",
      })
      return
    }

    // Validate formData
    const cleanedFormData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== null && value !== undefined && value !== "")
    )
    console.log("Submitting form data:", { selectedTemplateId, formData: cleanedFormData, priority, userId: user._id })

    if (Object.keys(cleanedFormData).length === 0) {
      toast({
        title: "Lỗi",
        description: "Dữ liệu biểu mẫu không hợp lệ. Vui lòng kiểm tra các trường bắt buộc.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingForm(true)
    try {
      await apiClient.post("/api/submissions", {
        formTemplateId: selectedTemplateId,
        data: cleanedFormData,
        priority, // Gửi priority cùng với formData
        createdBy: user._id,
      })
      toast({
        title: "Thành công",
        description: "Biểu mẫu của bạn đã được gửi đi để phê duyệt.",
      })
      router.push("/my-submissions")
    } catch (error: any) {
      console.error("Error submitting form:", error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message
      toast({
        title: "Lỗi",
        description: error.response?.status === 401
          ? "Không có quyền gửi biểu mẫu. Vui lòng đăng nhập lại."
          : errorMessage || "Lỗi khi gửi biểu mẫu.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingForm(false)
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Gửi biểu mẫu mới</h1>
      <Card>
        <CardHeader>
          <CardTitle>Chọn biểu mẫu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingTemplates ? (
            <div className="text-center text-gray-500">Đang tải danh sách biểu mẫu...</div>
          ) : (
            <div>
              <Label htmlFor="template-select" className="text-gray-700">Chọn biểu mẫu *</Label>
              <select
                id="template-select"
                value={selectedTemplateId || ""}
                onChange={(e) => handleSelectChange(e.target.value)}
                className="w-full p-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              >
                <option value="">Chọn một biểu mẫu...</option>
                {formTemplates.length === 0 ? (
                  <option value="no-templates" disabled>
                    Không có biểu mẫu nào khả dụng
                  </option>
                ) : (
                  formTemplates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {selectedTemplate && (
            <div className="mt-8 space-y-6">
              <div>
                <Label htmlFor="priority-select" className="text-gray-700">Mức độ ưu tiên *</Label>
                <select
                  id="priority-select"
                  value={priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="w-full p-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                >
                  <option value="">Chọn mức độ ưu tiên...</option>
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
                {priorityError && <p className="text-red-500 text-sm mt-1">{priorityError}</p>}
              </div>
              <h2 className="text-2xl font-semibold mb-4">{selectedTemplate.name}</h2>
              <p className="text-gray-600 mb-6">{selectedTemplate.description || "Không có mô tả."}</p>
              <FormRenderer
                fields={stableFields}
                onSubmit={handleSubmit}
                submitButtonText={isSubmittingForm ? "Đang gửi..." : "Gửi biểu mẫu"}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}