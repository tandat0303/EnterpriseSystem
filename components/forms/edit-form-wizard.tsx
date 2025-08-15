"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import type { FormTemplate, Workflow, FormField, Department } from "@/types"
import { LoadingCard } from "@/components/ui/loading"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { vi } from "date-fns/locale"

// Hàm định dạng số với dấu chấm phân cách
const formatNumber = (value: number | string): string => {
  if (value === "" || value === null || value === undefined) return ""
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 })
}

interface EditFormWizardProps {
  formId: string
}

export function EditFormWizard({ formId }: EditFormWizardProps) {
  const [formData, setFormData] = useState<FormTemplate | null>(null)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [form, workflowsData, departmentsData] = await Promise.all([
          apiClient.get(`/api/forms/${formId}`),
          apiClient.get<Workflow[]>("/api/workflows"),
          apiClient.get<Department[]>("/api/departments", { params: { status: "active" } }),
        ])
        setFormData(form)
        setWorkflows(Array.isArray(workflowsData) ? workflowsData : [])
        setDepartments(Array.isArray(departmentsData) ? departmentsData : [])
      } catch (error: any) {
        console.error("Error loading form data, workflows, or departments:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải dữ liệu biểu mẫu, luồng phê duyệt hoặc phòng ban.",
          variant: "destructive",
        })
        router.push("/forms")
      } finally {
        setIsLoading(false)
      }
    }
    if (formId) {
      loadData()
    }
  }, [formId, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleWorkflowChange = (value: string) => {
    setFormData((prev) => (prev ? { ...prev, workflowId: value } : null))
  }

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      label: "",
      type: "text",
      required: false,
    }
    setFormData((prev) =>
      prev ? { ...prev, fields: [...prev.fields, newField] } : null
    )
  }

  const removeField = (id: string) => {
    setFormData((prev) =>
      prev ? { ...prev, fields: prev.fields.filter((field) => field.id !== id) } : null
    )
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            fields: prev.fields.map((field) =>
              field.id === id ? { ...field, ...updates } : field
            ),
          }
        : null
    )
  }

  const validateFields = () => {
    const newErrors: Record<string, string> = {}
    if (!formData?.name || formData.name.trim().length < 3) {
      newErrors.name = "Tên biểu mẫu phải có ít nhất 3 ký tự."
    }
    if (!formData?.description || formData.description.trim().length < 10) {
      newErrors.description = "Mô tả biểu mẫu phải có ít nhất 10 ký tự."
    }
    if (!formData?.category || !departments.some((dept) => dept.name === formData.category)) {
      newErrors.category = "Vui lòng chọn một phòng ban hợp lệ."
    }
    if (formData?.fields.length === 0) {
      newErrors.fields = "Biểu mẫu phải có ít nhất một trường dữ liệu."
    } else {
      formData?.fields.forEach((field, index) => {
        if (!field.label || field.label.trim().length < 1) {
          newErrors[`field-${index}-label`] = "Nhãn trường không được để trống."
        }
        if (
          field.type === "select" &&
          (!field.options || field.options.length === 0 || field.options.some((opt) => opt.trim() === ""))
        ) {
          newErrors[`field-${index}-options`] = "Trường lựa chọn phải có ít nhất một tùy chọn và không được trống."
        }
        if (field.type === "number" && field.validation) {
          if (field.validation.min && (!Number.isInteger(Number(field.validation.min)) || isNaN(field.validation.min))) {
            newErrors[`field-${index}-min`] = "Giá trị tối thiểu phải là một số nguyên hợp lệ."
          }
          if (field.validation.max && (!Number.isInteger(Number(field.validation.max)) || isNaN(field.validation.max))) {
            newErrors[`field-${index}-max`] = "Giá trị tối đa phải là một số nguyên hợp lệ."
          }
          if (
            field.validation.min &&
            field.validation.max &&
            Number(field.validation.min) > Number(field.validation.max)
          ) {
            newErrors[`field-${index}-range`] = "Giá trị tối thiểu không được lớn hơn giá trị tối đa."
          }
        }
      })
    }
    if (!formData?.workflowId) {
      newErrors.workflowId = "Vui lòng chọn một luồng phê duyệt."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    if (!validateFields()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại các trường thông tin.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const updatedForm = await apiClient.put(`/api/forms/${formId}`, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        fields: formData.fields,
        workflowId:
          typeof formData.workflowId === "object"
            ? formData.workflowId._id
            : formData.workflowId,
      })
      toast({
        title: "Thành công",
        description: "Biểu mẫu đã được cập nhật.",
      })
      router.push(`/forms/${updatedForm._id}`)
    } catch (error: any) {
      console.error("Error saving form:", error)
      if (error.code === 11000 || error.response?.data?.code === 11000) {
        toast({
          title: "Lỗi",
          description: `Tên biểu mẫu "${formData.name}" đã tồn tại. Vui lòng chọn tên khác.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể cập nhật biểu mẫu.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
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

  if (!formData) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
        Không tìm thấy biểu mẫu.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Chỉnh sửa biểu mẫu: {formData.name}</h1>

        <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-blue-800">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-700">Tên biểu mẫu *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-700">Mô tả</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                disabled={isSaving}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <div>
              <Label htmlFor="category" className="text-gray-700">Danh mục (Phòng ban) *</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => (prev ? { ...prev, category: value } : null))
                }
                value={formData.category}
                disabled={isSaving || departments.length === 0}
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder={departments.length === 0 ? "Không có phòng ban" : "Chọn phòng ban"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              {departments.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Không có phòng ban nào để chọn.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800">Các trường dữ liệu</CardTitle>
              <Button
                onClick={addField}
                size="sm"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm trường
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-blue-200 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      updateField(field.id, { label: e.target.value })
                      setErrors((prev) => ({ ...prev, [`field-${index}-label`]: "" }))
                    }}
                    placeholder="Nhãn trường"
                    disabled={isSaving}
                    className="flex-1 mr-2 border-blue-200 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => removeField(field.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {errors[`field-${index}-label`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`field-${index}-label`]}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <Select
                    onValueChange={(value) =>
                      updateField(field.id, { type: value as FormField["type"] })
                    }
                    value={field.type}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-[180px] border-blue-200 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Văn bản</SelectItem>
                      <SelectItem value="textarea">Văn bản dài</SelectItem>
                      <SelectItem value="select">Lựa chọn</SelectItem>
                      <SelectItem value="date">Ngày tháng</SelectItem>
                      <SelectItem value="file">Tệp đính kèm</SelectItem>
                      <SelectItem value="number">Số</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center text-gray-700">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(field.id, { required: e.target.checked })
                      }
                      className="mr-2"
                      disabled={isSaving}
                    />
                    Bắt buộc
                  </label>
                </div>
                <div className="mt-2">
                  {field.type === "text" && (
                    <Input placeholder="Giá trị văn bản" disabled={true} className="border-blue-200 focus:ring-blue-500" />
                  )}
                  {field.type === "textarea" && (
                    <Textarea placeholder="Giá trị văn bản dài" disabled={true} className="border-blue-200 focus:ring-blue-500" />
                  )}
                  {field.type === "date" && (
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                      <DateTimePicker
                        label="Ngày và giờ"
                        disabled={true}
                        minDate={new Date()} // Không cho chọn ngày trước hiện tại
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                borderColor: "blue.200",
                                "&:hover fieldset": { borderColor: "blue.300" },
                                "&.Mui-focused fieldset": { borderColor: "blue.500" },
                              },
                            },
                          },
                        }}
                        format="dd/MM/yyyy HH:mm"
                      />
                    </LocalizationProvider>
                  )}
                  {field.type === "file" && <Input type="file" disabled={true} className="border-blue-200 focus:ring-blue-500" />}
                  {field.type === "number" && (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Giá trị số"
                        value={field.validation?.defaultValue ? formatNumber(field.validation.defaultValue) : ""}
                        disabled={true}
                        className="border-blue-200 focus:ring-blue-500"
                      />
                      <div className="flex space-x-2">
                        <div>
                          <Label htmlFor={`min-${field.id}`} className="text-gray-700">Tối thiểu</Label>
                          <Input
                            id={`min-${field.id}`}
                            type="text"
                            value={field.validation?.min ? formatNumber(field.validation.min) : ""}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/\./g, "")
                              updateField(field.id, {
                                validation: { ...field.validation, min: rawValue === "" ? undefined : Number(rawValue) },
                              })
                              setErrors((prev) => ({ ...prev, [`field-${index}-min`]: "" }))
                            }}
                            placeholder="Số nguyên tối thiểu"
                            className="border-blue-200 focus:ring-blue-500"
                            disabled={isSaving}
                          />
                          {errors[`field-${index}-min`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`field-${index}-min`]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`max-${field.id}`} className="text-gray-700">Tối đa</Label>
                          <Input
                            id={`max-${field.id}`}
                            type="text"
                            value={field.validation?.max ? formatNumber(field.validation.max) : ""}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/\./g, "")
                              updateField(field.id, {
                                validation: { ...field.validation, max: rawValue === "" ? undefined : Number(rawValue) },
                              })
                              setErrors((prev) => ({ ...prev, [`field-${index}-max`]: "" }))
                            }}
                            placeholder="Số nguyên tối đa"
                            className="border-blue-200 focus:ring-blue-500"
                            disabled={isSaving}
                          />
                          {errors[`field-${index}-max`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`field-${index}-max`]}</p>
                          )}
                        </div>
                      </div>
                      {errors[`field-${index}-range`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`field-${index}-range`]}</p>
                      )}
                    </div>
                  )}
                  {field.type === "select" && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Các lựa chọn (cách nhau bởi dấu phẩy)"
                        value={field.options?.join(", ") || ""}
                        onChange={(e) =>
                          updateField(field.id, {
                            options: e.target.value
                              .split(",")
                              .map((opt) => opt.trim()),
                          })
                        }
                        disabled={isSaving}
                        className="border-blue-200 focus:ring-blue-500"
                      />
                      {errors[`field-${index}-options`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`field-${index}-options`]}</p>
                      )}
                      <select
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-blue-500"
                        disabled={true}
                      >
                        {field.options?.map((option, idx) => (
                          <option key={idx} value={option}>
                            {option}
                          </option>
                        ))}
                        {(!field.options || field.options.length === 0) && (
                          <option>Chưa có lựa chọn</option>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {formData.fields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Chưa có trường nào. Nhấn "Thêm trường" để bắt đầu.
              </div>
            )}
            {errors.fields && <p className="text-red-500 text-sm mt-1">{errors.fields}</p>}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-blue-800">Chọn luồng phê duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={handleWorkflowChange}
              value={
                typeof formData.workflowId === "object"
                  ? formData.workflowId._id
                  : formData.workflowId
              }
              disabled={isSaving}
            >
              <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Chọn luồng phê duyệt" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((workflow) => (
                  <SelectItem key={workflow._id} value={workflow._id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.workflowId && <p className="text-red-500 text-sm mt-1">{errors.workflowId}</p>}
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          Lưu thay đổi
        </Button>
      </form>
    </div>
  )
}