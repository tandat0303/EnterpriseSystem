"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef, memo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import type { FormField, FormFieldOption } from "@/types"

// Hàm định dạng số với dấu chấm phân cách
const formatNumber = (value: number | string): string => {
  if (value === "" || value === null || value === undefined) return ""
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 })
}

interface FormRendererProps {
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => void
  initialData?: Record<string, any>
  readOnly?: boolean
  submitButtonText?: string
}

interface FieldRendererProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  error?: string
  readOnly?: boolean
}

const FieldRenderer = memo(({ field, value, onChange, error, readOnly }: FieldRendererProps) => {
  const options = field.type === "select"
    ? (field.options ?? []).map((opt) =>
        typeof opt === "string" ? opt : (opt as FormFieldOption).value
      )
    : []

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.type === "text" && (
        <Input
          id={field.id}
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className={cn("border-blue-200 focus:ring-blue-500", error && "border-red-500")}
        />
      )}
      {field.type === "textarea" && (
        <Textarea
          id={field.id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className={cn("border-blue-200 focus:ring-blue-500", error && "border-red-500")}
        />
      )}
      {field.type === "select" && (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={cn("w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-blue-500", error && "border-red-500")}
        >
          <option value="">{`Chọn ${field.label.toLowerCase()}`}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      {field.type === "date" && (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
          <DateTimePicker
            label={`Chọn ngày và giờ ${field.label.toLowerCase()}`}
            value={value ? new Date(value) : null}
            onChange={(newValue) => onChange(newValue ? newValue.toISOString() : "")}
            disabled={readOnly}
            minDate={new Date()} // Không cho chọn ngày trước hiện tại
            slotProps={{
              textField: {
                fullWidth: true,
                variant: "outlined",
                error: !!error,
                helperText: error,
                sx: {
                  "& .MuiOutlinedInput-root": {
                    borderColor: error ? "red" : "blue.200",
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
      {field.type === "file" && (
        <Input
          id={field.id}
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder="Tên file hoặc URL"
          className={cn("border-blue-200 focus:ring-blue-500", error && "border-red-500")}
        />
      )}
      {field.type === "number" && (
        <Input
          id={field.id}
          type="text" // Sử dụng type="text" để hiển thị định dạng 1.000
          value={formatNumber(value)}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/\./g, "") // Xóa dấu chấm để xử lý
            if (rawValue === "" || /^[0-9]+$/.test(rawValue)) {
              onChange(rawValue === "" ? "" : Number(rawValue))
            }
          }}
          readOnly={readOnly}
          placeholder="Nhập số nguyên"
          className={cn("border-blue-200 focus:ring-blue-500", error && "border-red-500")}
        />
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
})
FieldRenderer.displayName = "FieldRenderer"

export function FormRenderer({
  fields,
  onSubmit,
  initialData = {},
  readOnly = false,
  submitButtonText = "Gửi biểu mẫu",
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const renderCount = useRef(0)
  const isInitialized = useRef(false)

  useEffect(() => {
    renderCount.current += 1
    if (renderCount.current > 100) {
      console.error("Possible infinite render loop detected in FormRenderer!")
    }
  })

  const stableFields = useMemo(() => {
    const cleanedFields = fields
      .filter((field) => field.id && typeof field.id === "string")
      .map((field) => {
        if (field.type === "select") {
          const validOptions = (field.options ?? [])
            .map((opt) => (typeof opt === "string" ? opt : (opt as FormFieldOption).value))
            .filter((opt) => opt != null && typeof opt === "string" && opt.trim() !== "")
            .filter((opt, index, self) => self.indexOf(opt) === index)
          return { ...field, options: validOptions }
        }
        return field
      })
    const fieldIds = cleanedFields.map((f) => f.id)
    const uniqueIds = new Set(fieldIds)
    if (uniqueIds.size !== fieldIds.length) {
      console.error("Duplicate field IDs detected:", cleanedFields)
    }
    return cleanedFields
  }, [fields])

  const stableInitialData = useMemo(() => initialData, [initialData])

  useEffect(() => {
    if (isInitialized.current) return
    const initial: Record<string, any> = {}
    stableFields.forEach((field) => {
      const initialValue = stableInitialData[field.id] !== undefined ? stableInitialData[field.id] : ""
      if (field.type === "select" && initialValue && !field.options?.includes(initialValue)) {
        initial[field.id] = ""
      } else {
        initial[field.id] = initialValue
      }
    })
    setFormData(initial)
    isInitialized.current = true
  }, [stableFields, stableInitialData])

  const handleChange = (fieldId: string, value: any) => {
    const field = stableFields.find((f) => f.id === fieldId)
    if (field?.type === "select" && value && !field.options?.includes(value)) {
      console.warn(`Invalid value for select field ${fieldId}: ${value}`)
      return
    }
    setFormData((prev) => {
      if (prev[fieldId] === value) return prev
      return { ...prev, [fieldId]: value }
    })
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (value === null || value === undefined || value === "")) {
      return `${field.label} là trường bắt buộc.`
    }
    if (field.validation) {
      if (field.validation.minLength && value.length < field.validation.minLength) {
        return `${field.label} phải có ít nhất ${field.validation.minLength} ký tự.`
      }
      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        return `${field.label} không được vượt quá ${field.validation.maxLength} ký tự.`
      }
      if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
        return `${field.label} không đúng định dạng.`
      }
    }
    if (field.type === "date" && value) {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        return `${field.label} không phải là ngày giờ hợp lệ.`
      }
      if (date < new Date()) {
        return `${field.label} không được chọn ngày trong quá khứ.`
      }
    }
    if (field.type === "file" && value && !/^(https?:\/\/|\/Uploads\/)/.test(value)) {
      return `${field.label} phải là URL hợp lệ hoặc đường dẫn tải lên.`
    }
    if (field.type === "number" && value !== "") {
      if (isNaN(value)) {
        return `${field.label} phải là một số hợp lệ.`
      }
      if (!Number.isInteger(Number(value))) {
        return `${field.label} phải là số nguyên.`
      }
      if (field.validation) {
        if (field.validation.min && Number(value) < field.validation.min) {
          return `${field.label} phải lớn hơn hoặc bằng ${field.validation.min}.`
        }
        if (field.validation.max && Number(value) > field.validation.max) {
          return `${field.label} không được vượt quá ${field.validation.max}.`
        }
      }
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    stableFields.forEach((field) => {
      const error = validateField(field, formData[field.id])
      if (error) {
        newErrors[field.id] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const cleanedFormData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== null && value !== undefined && value !== "")
    )
    onSubmit(cleanedFormData)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {stableFields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => handleChange(field.id, value)}
            error={errors[field.id]}
            readOnly={readOnly}
          />
        ))}
        {!readOnly && (
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            {submitButtonText}
          </Button>
        )}
      </form>
    </div>
  )
}