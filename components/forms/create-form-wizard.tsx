"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, ArrowRight, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ButtonLoading } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"
import type { FormField, Workflow, Role, Department } from "@/types"
import { useAuth } from "@/components/providers/auth-provider"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { vi } from "date-fns/locale"

// Hàm định dạng số với dấu chấm phân cách
const formatNumber = (value: number | string): string => {
  if (value === "" || value === null || value === undefined) return ""
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 })
}

export function CreateFormWizard() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    fields: [] as FormField[],
    workflowId: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [workflowsData, departmentsData] = await Promise.all([
          apiClient.get<Workflow[]>("/api/workflows"),
          apiClient.get<Department[]>("/api/departments", { params: { status: "active" } }),
        ])
        setWorkflows(Array.isArray(workflowsData) ? workflowsData : [])
        setDepartments(Array.isArray(departmentsData) ? departmentsData : [])
      } catch (error: any) {
        console.error("Failed to fetch workflows or departments:", error)
        setWorkflows([])
        setDepartments([])
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách luồng phê duyệt hoặc phòng ban.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Tên biểu mẫu phải có ít nhất 3 ký tự."
    }
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = "Mô tả biểu mẫu phải có ít nhất 10 ký tự."
    }
    if (!formData.category || !departments.some((dept) => dept.name === formData.category)) {
      newErrors.category = "Vui lòng chọn một phòng ban hợp lệ."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (formData.fields.length === 0) {
      newErrors.fields = "Biểu mẫu phải có ít nhất một trường dữ liệu."
    } else {
      formData.fields.forEach((field, index) => {
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.workflowId) {
      newErrors.workflowId = "Vui lòng chọn một luồng phê duyệt."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    let isValid = false
    if (currentStep === 1) {
      isValid = validateStep1()
    } else if (currentStep === 2) {
      isValid = validateStep2()
    }

    if (isValid) {
      setCurrentStep((prev) => prev + 1)
    } else {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại các trường thông tin.",
        variant: "destructive",
      })
    }
  }

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      label: "",
      type: "text",
      required: false,
    }
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
  }

  const removeField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== id),
    }))
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => (field.id === id ? { ...field, ...updates } : field)),
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep3()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại các trường thông tin.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await apiClient.post("/api/forms", {
        ...formData,
        createdBy: user?._id,
      })

      toast({
        title: "Thành công",
        description: "Biểu mẫu đã được tạo thành công!",
      })
      router.push("/forms")
    } catch (error: any) {
      console.error("Create form failed:", error)
      if (error.code === 11000 || error.response?.data?.code === 11000) {
        toast({
          title: "Lỗi",
          description: `Tên biểu mẫu "${formData.name}" đã tồn tại. Vui lòng chọn tên khác.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Lỗi",
          description: error.message || "Có lỗi xảy ra khi tạo biểu mẫu.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-blue-800">Thông tin cơ bản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-gray-700">Tên biểu mẫu *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }))
              setErrors((prev) => ({ ...prev, name: "" }))
            }}
            placeholder="Nhập tên biểu mẫu"
            disabled={isLoading}
            className="border-blue-200 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="description" className="text-gray-700">Mô tả *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, description: e.target.value }))
              setErrors((prev) => ({ ...prev, description: "" }))
            }}
            placeholder="Mô tả chi tiết về biểu mẫu"
            disabled={isLoading}
            className="border-blue-200 focus:ring-blue-500"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>
        <div>
          <Label htmlFor="category" className="text-gray-700">Danh mục (Phòng ban) *</Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, category: e.target.value }))
              setErrors((prev) => ({ ...prev, category: "" }))
            }}
            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || departments.length === 0}
          >
            <option value="">{departments.length === 0 ? "Không có phòng ban" : "Chọn phòng ban"}</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          {departments.length === 0 && (
            <p className="text-sm text-red-500 mt-1">Không có phòng ban nào để chọn.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-800">Thiết kế trường dữ liệu</CardTitle>
          <Button
            onClick={addField}
            size="sm"
            disabled={isLoading}
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
                className="flex-1 mr-2 border-blue-200 focus:ring-blue-500"
                disabled={isLoading}
              />
              <Button
                onClick={() => removeField(field.id)}
                size="sm"
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {errors[`field-${index}-label`] && (
              <p className="text-red-500 text-sm mt-1">{errors[`field-${index}-label`]}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <select
                value={field.type}
                onChange={(e) => updateField(field.id, { type: e.target.value as FormField["type"] })}
                className="px-3 py-2 border border-blue-200 rounded-md focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="text">Văn bản</option>
                <option value="textarea">Văn bản dài</option>
                <option value="select">Lựa chọn</option>
                <option value="date">Ngày tháng</option>
                <option value="file">Tệp đính kèm</option>
                <option value="number">Số</option>
              </select>
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="mr-2"
                  disabled={isLoading}
                />
                Bắt buộc
              </label>
            </div>
            <div className="mt-2">
              {field.type === "text" && <Input placeholder="Giá trị văn bản" disabled={true} className="border-blue-200 focus:ring-blue-500" />}
              {field.type === "textarea" && <Textarea placeholder="Giá trị văn bản dài" disabled={true} className="border-blue-200 focus:ring-blue-500" />}
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
                        value={field.validation?.min ?? ""}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\./g, "")
                          updateField(field.id, {
                            validation: { ...field.validation, min: rawValue === "" ? undefined : Number(rawValue) },
                          })
                          setErrors((prev) => ({ ...prev, [`field-${index}-min`]: "" }))
                        }}
                        placeholder="Số nguyên tối thiểu"
                        className="border-blue-200 focus:ring-blue-500"
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                    onChange={(e) => {
                      updateField(field.id, { options: e.target.value.split(",").map((opt) => opt.trim()) })
                      setErrors((prev) => ({ ...prev, [`field-${index}-options`]: "" }))
                    }}
                    disabled={isLoading}
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
                    {(!field.options || field.options.length === 0) && <option>Chưa có lựa chọn</option>}
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
  )

  const renderStep3 = () => (
    <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-blue-800">Chọn luồng phê duyệt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow._id}
              className={`
                p-4 border rounded-lg cursor-pointer transition-colors duration-200
                ${formData.workflowId === workflow._id ? "border-blue-500 bg-blue-50" : "border-blue-200 hover:bg-blue-50"}
              `}
              onClick={() => {
                setFormData((prev) => ({ ...prev, workflowId: workflow._id }))
                setErrors((prev) => ({ ...prev, workflowId: "" }))
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-lg text-gray-800">{workflow.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Các bước phê duyệt:</p>
                    {workflow.steps.map((step, index) => (
                      <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                        <span className="font-medium">Bước {index + 1}:</span> {(step.roleId as Role)?.displayName || "N/A"}
                      </div>
                    ))}
                  </div>
                </div>
                {formData.workflowId === workflow._id && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Đã chọn</Badge>}
              </div>
            </div>
          ))}
        </div>
        {workflows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Chưa có luồng phê duyệt nào. Vui lòng tạo luồng phê duyệt trước.
          </div>
        )}
        {errors.workflowId && <p className="text-red-500 text-sm mt-1">{errors.workflowId}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <div className="flex items-center justify-center space-x-4 mb-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </div>
            {step < 3 && <div className={`w-16 h-1 ${currentStep > step ? "bg-blue-600" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 1 || isLoading}
          variant="outline"
          className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Tiếp theo
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            <ButtonLoading isLoading={isLoading} loadingText="Đang tạo biểu mẫu...">
              Tạo biểu mẫu
            </ButtonLoading>
          </Button>
        )}
      </div>
    </div>
  )
}