"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ButtonLoading } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import type { FormField, Workflow, Role, Department } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formatNumber = (value: number | string): string => {
  if (value === "" || value === null || value === undefined) return "";
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
};

const inputClass =
  "h-9 text-[13px] border-slate-200 focus:border-sky-300 focus:ring-1 focus:ring-sky-200";
const selectClass =
  "w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 appearance-none";

const steps = [
  { n: 1, label: "Thông tin cơ bản" },
  { n: 2, label: "Trường dữ liệu" },
  { n: 3, label: "Luồng phê duyệt" },
];

const fieldTypeOptions = [
  { value: "text", label: "Văn bản" },
  { value: "textarea", label: "Văn bản dài" },
  { value: "select", label: "Lựa chọn" },
  { value: "date", label: "Ngày tháng" },
  { value: "file", label: "Tệp đính kèm" },
  { value: "number", label: "Số" },
];

export function CreateFormWizard() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    fields: [] as FormField[],
    workflowId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [wf, depts] = await Promise.all([
          apiClient.get<Workflow[]>("/api/workflows"),
          apiClient.get<Department[]>("/api/departments", {
            params: { status: "active" },
          }),
        ]);
        setWorkflows(Array.isArray(wf) ? wf : []);
        setDepartments(Array.isArray(depts) ? depts : []);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải dữ liệu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.name || formData.name.trim().length < 3)
      e.name = "Tên biểu mẫu phải có ít nhất 3 ký tự.";
    if (!formData.description || formData.description.trim().length < 10)
      e.description = "Mô tả phải có ít nhất 10 ký tự.";
    if (
      !formData.category ||
      !departments.some((d) => d.name === formData.category)
    )
      e.category = "Vui lòng chọn một phòng ban hợp lệ.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!formData.fields.length)
      e.fields = "Biểu mẫu phải có ít nhất một trường dữ liệu.";
    else
      formData.fields.forEach((f, i) => {
        if (!f.label?.trim())
          e[`field-${i}-label`] = "Nhãn trường không được để trống.";
        if (
          f.type === "select" &&
          (!f.options?.length || f.options.some((o) => !o.trim()))
        )
          e[`field-${i}-options`] =
            "Trường lựa chọn phải có ít nhất một tùy chọn.";
        if (f.type === "number" && f.validation) {
          if (
            f.validation.min !== undefined &&
            !Number.isInteger(Number(f.validation.min))
          )
            e[`field-${i}-min`] = "Giá trị tối thiểu phải là số nguyên.";
          if (
            f.validation.max !== undefined &&
            !Number.isInteger(Number(f.validation.max))
          )
            e[`field-${i}-max`] = "Giá trị tối đa phải là số nguyên.";
          if (
            f.validation.min !== undefined &&
            f.validation.max !== undefined &&
            Number(f.validation.min) > Number(f.validation.max)
          )
            e[`field-${i}-range`] =
              "Giá trị tối thiểu không được lớn hơn tối đa.";
        }
      });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!formData.workflowId)
      e.workflowId = "Vui lòng chọn một luồng phê duyệt.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => {
    const valid =
      currentStep === 1
        ? validateStep1()
        : currentStep === 2
          ? validateStep2()
          : true;
    if (valid) setCurrentStep((p) => p + 1);
    else
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại thông tin.",
        variant: "destructive",
      });
  };

  const addField = () => {
    setFormData((p) => ({
      ...p,
      fields: [
        ...p.fields,
        { id: Date.now().toString(), label: "", type: "text", required: false },
      ],
    }));
  };

  const removeField = (id: string) =>
    setFormData((p) => ({ ...p, fields: p.fields.filter((f) => f.id !== id) }));
  const updateField = (id: string, updates: Partial<FormField>) =>
    setFormData((p) => ({
      ...p,
      fields: p.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));

  const handleSubmit = async () => {
    if (!validateStep3()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn luồng phê duyệt.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post("/api/forms", { ...formData, createdBy: user?._id });
      toast({ title: "Thành công", description: "Biểu mẫu đã được tạo!" });
      router.push("/forms");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <div key={step.n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-200",
                  currentStep > step.n
                    ? "bg-emerald-500 text-white"
                    : currentStep === step.n
                      ? "bg-[#0f172a] text-white"
                      : "bg-slate-100 text-slate-400",
                )}
              >
                {currentStep > step.n ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.n
                )}
              </div>
              <span
                className={cn(
                  "text-[12.5px] font-medium hidden sm:block",
                  currentStep === step.n ? "text-slate-800" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 sm:w-16 h-px mx-2 sm:mx-3 transition-colors",
                  currentStep > step.n ? "bg-emerald-300" : "bg-slate-200",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
            <h2 className="text-[13px] font-semibold text-slate-700">
              Thông tin cơ bản
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-medium text-slate-600">
                Tên biểu mẫu <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, name: e.target.value }));
                  setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="VD: Đơn xin nghỉ phép"
                disabled={isLoading}
                className={inputClass}
              />
              {errors.name && (
                <p className="text-[11px] text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-medium text-slate-600">
                Mô tả <span className="text-red-400">*</span>
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, description: e.target.value }));
                  setErrors((p) => ({ ...p, description: "" }));
                }}
                placeholder="Mô tả chi tiết về biểu mẫu..."
                disabled={isLoading}
                rows={3}
                className="text-[13px] border-slate-200 focus:border-sky-300 focus:ring-sky-200"
              />
              {errors.description && (
                <p className="text-[11px] text-red-500">{errors.description}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-medium text-slate-600">
                Phòng ban <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, category: e.target.value }));
                    setErrors((p) => ({ ...p, category: "" }));
                  }}
                  className={selectClass}
                  disabled={isLoading || !departments.length}
                >
                  <option value="">
                    {departments.length
                      ? "Chọn phòng ban"
                      : "Không có phòng ban"}
                  </option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
              {errors.category && (
                <p className="text-[11px] text-red-500">{errors.category}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-slate-700">
              Thiết kế trường dữ liệu
            </h2>
            <Button
              onClick={addField}
              size="sm"
              disabled={isLoading}
              className="h-7 px-3 text-[12px] bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg gap-1"
            >
              <Plus className="h-3 w-3" /> Thêm trường
            </Button>
          </div>
          <div className="px-5 py-4 space-y-3">
            {formData.fields.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[13px] text-slate-400">
                  Chưa có trường nào. Nhấn "Thêm trường" để bắt đầu.
                </p>
              </div>
            )}
            {formData.fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/40"
              >
                {/* Field header */}
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                    {index + 1}
                  </span>
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      updateField(field.id, { label: e.target.value });
                      setErrors((p) => ({
                        ...p,
                        [`field-${index}-label`]: "",
                      }));
                    }}
                    placeholder="Nhãn trường"
                    className={`${inputClass} flex-1`}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => removeField(field.id)}
                    disabled={isLoading}
                    className="h-7 w-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {errors[`field-${index}-label`] && (
                  <p className="text-[11px] text-red-500">
                    {errors[`field-${index}-label`]}
                  </p>
                )}

                {/* Type + required */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(field.id, {
                          type: e.target.value as FormField["type"],
                        })
                      }
                      className={`${selectClass} w-36`}
                      disabled={isLoading}
                    >
                      {fieldTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  <label className="flex items-center gap-1.5 text-[12.5px] text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(field.id, { required: e.target.checked })
                      }
                      className="rounded border-slate-300 text-sky-500"
                      disabled={isLoading}
                    />
                    Bắt buộc
                  </label>
                </div>

                {/* Select options */}
                {field.type === "select" && (
                  <div className="space-y-1.5">
                    <Input
                      value={field.options?.join(", ") || ""}
                      onChange={(e) => {
                        updateField(field.id, {
                          options: e.target.value
                            .split(",")
                            .map((o) => o.trim()),
                        });
                        setErrors((p) => ({
                          ...p,
                          [`field-${index}-options`]: "",
                        }));
                      }}
                      placeholder="Các lựa chọn, cách nhau bởi dấu phẩy"
                      className={inputClass}
                      disabled={isLoading}
                    />
                    {errors[`field-${index}-options`] && (
                      <p className="text-[11px] text-red-500">
                        {errors[`field-${index}-options`]}
                      </p>
                    )}
                  </div>
                )}

                {/* Number min/max */}
                {field.type === "number" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">
                        Tối thiểu
                      </Label>
                      <Input
                        type="text"
                        value={field.validation?.min ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\./g, "");
                          updateField(field.id, {
                            validation: {
                              ...field.validation,
                              min: v === "" ? undefined : Number(v),
                            },
                          });
                          setErrors((p) => ({
                            ...p,
                            [`field-${index}-min`]: "",
                          }));
                        }}
                        placeholder="Không giới hạn"
                        className={`${inputClass} font-mono`}
                        disabled={isLoading}
                      />
                      {errors[`field-${index}-min`] && (
                        <p className="text-[11px] text-red-500">
                          {errors[`field-${index}-min`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">
                        Tối đa
                      </Label>
                      <Input
                        type="text"
                        value={
                          field.validation?.max
                            ? formatNumber(field.validation.max)
                            : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value.replace(/\./g, "");
                          updateField(field.id, {
                            validation: {
                              ...field.validation,
                              max: v === "" ? undefined : Number(v),
                            },
                          });
                          setErrors((p) => ({
                            ...p,
                            [`field-${index}-max`]: "",
                          }));
                        }}
                        placeholder="Không giới hạn"
                        className={`${inputClass} font-mono`}
                        disabled={isLoading}
                      />
                      {errors[`field-${index}-max`] && (
                        <p className="text-[11px] text-red-500">
                          {errors[`field-${index}-max`]}
                        </p>
                      )}
                    </div>
                    {errors[`field-${index}-range`] && (
                      <p className="text-[11px] text-red-500 col-span-2">
                        {errors[`field-${index}-range`]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {errors.fields && (
              <p className="text-[11px] text-red-500">{errors.fields}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
            <h2 className="text-[13px] font-semibold text-slate-700">
              Chọn luồng phê duyệt
            </h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {workflows.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px] text-slate-400">
                  Chưa có luồng phê duyệt. Vui lòng tạo luồng trước.
                </p>
              </div>
            ) : (
              workflows.map((wf) => (
                <div
                  key={wf._id}
                  className={cn(
                    "border rounded-xl p-4 cursor-pointer transition-all duration-150",
                    formData.workflowId === wf._id
                      ? "border-sky-300 bg-sky-50/50 shadow-sm shadow-sky-100"
                      : "border-slate-100 hover:border-slate-200 bg-white",
                  )}
                  onClick={() => {
                    setFormData((p) => ({ ...p, workflowId: wf._id }));
                    setErrors((p) => ({ ...p, workflowId: "" }));
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 transition-all",
                            formData.workflowId === wf._id
                              ? "border-sky-500 bg-sky-500"
                              : "border-slate-300",
                          )}
                        />
                        <p className="text-[13px] font-semibold text-slate-800">
                          {wf.name}
                        </p>
                      </div>
                      {wf.description && (
                        <p className="text-[12px] text-slate-500 ml-5 mb-2">
                          {wf.description}
                        </p>
                      )}
                      <div className="ml-5 space-y-1">
                        {wf.steps.map((step, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-[11.5px] text-slate-500"
                          >
                            <span className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400 flex-shrink-0">
                              {i + 1}
                            </span>
                            {(step.roleId as Role)?.displayName || "N/A"}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {errors.workflowId && (
              <p className="text-[11px] text-red-500">{errors.workflowId}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setCurrentStep((p) => p - 1)}
          disabled={currentStep === 1 || isLoading}
          variant="ghost"
          className="h-9 px-4 text-[13px] text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg gap-1.5 disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
        </Button>
        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="h-9 px-5 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg gap-1.5"
          >
            Tiếp theo <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-9 px-5 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg"
          >
            <ButtonLoading isLoading={isLoading} loadingText="Đang tạo...">
              Tạo biểu mẫu
            </ButtonLoading>
          </Button>
        )}
      </div>
    </div>
  );
}
