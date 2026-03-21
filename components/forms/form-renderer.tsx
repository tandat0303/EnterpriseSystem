"use client";

import type React from "react";
import { useState, useEffect, useMemo, useRef, memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { vi } from "date-fns/locale";
import type { FormField, FormFieldOption } from "@/types";
import { ChevronDown, Send } from "lucide-react";

const formatNumber = (value: number | string): string => {
  if (value === "" || value === null || value === undefined) return "";
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
};

interface FormRendererProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  readOnly?: boolean;
  submitButtonText?: string;
}

interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  readOnly?: boolean;
}

const baseInputClass =
  "h-9 text-[13px] border-slate-200 focus:border-sky-300 focus:ring-1 focus:ring-sky-200";

const FieldRenderer = memo(
  ({ field, value, onChange, error, readOnly }: FieldRendererProps) => {
    const options =
      field.type === "select"
        ? (field.options ?? []).map((o) =>
            typeof o === "string" ? o : (o as FormFieldOption).value,
          )
        : [];

    return (
      <div className="space-y-1.5">
        <Label
          htmlFor={field.id}
          className="text-[12.5px] font-medium text-slate-600"
        >
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </Label>

        {field.type === "text" && (
          <Input
            id={field.id}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            className={cn(
              baseInputClass,
              error && "border-red-300 focus:border-red-400 focus:ring-red-100",
            )}
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            id={field.id}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            rows={3}
            className={cn(
              "text-[13px] border-slate-200 focus:border-sky-300 focus:ring-sky-200",
              error && "border-red-300",
            )}
          />
        )}

        {field.type === "select" && (
          <div className="relative">
            <select
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={readOnly}
              className={cn(
                "w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 appearance-none",
                error && "border-red-300",
                readOnly && "opacity-60 cursor-default",
              )}
            >
              <option value="">{`Chọn ${field.label.toLowerCase()}`}</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        )}

        {field.type === "date" && (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <DateTimePicker
              label={`Chọn ngày ${field.label.toLowerCase()}`}
              value={value ? new Date(value) : null}
              onChange={(v) => onChange(v ? v.toISOString() : "")}
              disabled={readOnly}
              minDate={new Date()}
              format="dd/MM/yyyy HH:mm"
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                  error: !!error,
                  sx: {
                    "& .MuiInputBase-root": { height: 36, fontSize: 13 },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: error ? "#fca5a5" : "#e2e8f0",
                      borderRadius: 8,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#bae6fd",
                    },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#38bdf8",
                      borderWidth: 1,
                    },
                  },
                },
              }}
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
            className={cn(baseInputClass, error && "border-red-300")}
          />
        )}

        {field.type === "number" && (
          <Input
            id={field.id}
            type="text"
            value={formatNumber(value)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, "");
              if (raw === "" || /^[0-9]+$/.test(raw))
                onChange(raw === "" ? "" : Number(raw));
            }}
            readOnly={readOnly}
            placeholder="Nhập số nguyên"
            className={cn(baseInputClass, error && "border-red-300")}
          />
        )}

        {error && <p className="text-red-500 text-[11px]">{error}</p>}
      </div>
    );
  },
);
FieldRenderer.displayName = "FieldRenderer";

export function FormRenderer({
  fields,
  onSubmit,
  initialData = {},
  readOnly = false,
  submitButtonText = "Gửi biểu mẫu",
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const renderCount = useRef(0);
  const isInitialized = useRef(false);

  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 100)
      console.error("Possible infinite render loop detected in FormRenderer!");
  });

  const stableFields = useMemo(() => {
    return fields
      .filter((f) => f.id && typeof f.id === "string")
      .map((f) =>
        f.type === "select"
          ? {
              ...f,
              options: (f.options ?? [])
                .map((o) =>
                  typeof o === "string" ? o : (o as FormFieldOption).value,
                )
                .filter(
                  (o, i, s) =>
                    o &&
                    typeof o === "string" &&
                    o.trim() &&
                    s.indexOf(o) === i,
                ),
            }
          : f,
      );
  }, [fields]);

  const stableInitialData = useMemo(() => initialData, [initialData]);

  useEffect(() => {
    if (isInitialized.current) return;
    const init: Record<string, any> = {};
    stableFields.forEach((f) => {
      const v =
        stableInitialData[f.id] !== undefined ? stableInitialData[f.id] : "";
      init[f.id] = f.type === "select" && v && !f.options?.includes(v) ? "" : v;
    });
    setFormData(init);
    isInitialized.current = true;
  }, [stableFields, stableInitialData]);

  const handleChange = (fieldId: string, value: any) => {
    const field = stableFields.find((f) => f.id === fieldId);
    if (field?.type === "select" && value && !field.options?.includes(value))
      return;
    setFormData((p) => (p[fieldId] === value ? p : { ...p, [fieldId]: value }));
    if (errors[fieldId])
      setErrors((p) => {
        const n = { ...p };
        delete n[fieldId];
        return n;
      });
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (
      field.required &&
      (value === null || value === undefined || value === "")
    )
      return `${field.label} là trường bắt buộc.`;
    if (field.validation) {
      if (
        field.validation.minLength &&
        value.length < field.validation.minLength
      )
        return `${field.label} phải có ít nhất ${field.validation.minLength} ký tự.`;
      if (
        field.validation.maxLength &&
        value.length > field.validation.maxLength
      )
        return `${field.label} không được vượt quá ${field.validation.maxLength} ký tự.`;
      if (
        field.validation.pattern &&
        !new RegExp(field.validation.pattern).test(value)
      )
        return `${field.label} không đúng định dạng.`;
    }
    if (field.type === "date" && value) {
      const d = new Date(value);
      if (isNaN(d.getTime())) return `${field.label} không phải ngày hợp lệ.`;
      if (d < new Date())
        return `${field.label} không được chọn ngày trong quá khứ.`;
    }
    if (field.type === "number" && value !== "") {
      if (isNaN(value)) return `${field.label} phải là số hợp lệ.`;
      if (!Number.isInteger(Number(value)))
        return `${field.label} phải là số nguyên.`;
      if (field.validation?.min && Number(value) < field.validation.min)
        return `${field.label} phải ≥ ${field.validation.min}.`;
      if (field.validation?.max && Number(value) > field.validation.max)
        return `${field.label} phải ≤ ${field.validation.max}.`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    stableFields.forEach((f) => {
      const err = validateField(f, formData[f.id]);
      if (err) newErrors[f.id] = err;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    onSubmit(
      Object.fromEntries(
        Object.entries(formData).filter(
          ([, v]) => v !== null && v !== undefined && v !== "",
        ),
      ),
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {stableFields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={formData[field.id]}
          onChange={(v) => handleChange(field.id, v)}
          error={errors[field.id]}
          readOnly={readOnly}
        />
      ))}
      {!readOnly && (
        <div className="pt-2">
          <Button
            type="submit"
            className="h-9 px-5 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            {submitButtonText}
          </Button>
        </div>
      )}
    </form>
  );
}
