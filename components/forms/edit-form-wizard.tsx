"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, ArrowLeft, Save, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ButtonLoading, LoadingCard } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import type {
  FormField,
  FormTemplate,
  Workflow,
  Role,
  Department,
} from "@/types";
import { cn } from "@/lib/utils";

const formatNumber = (value: number | string): string => {
  if (value === "" || value === null || value === undefined) return "";
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 });
};

const inputClass =
  "h-9 text-[13px] border-slate-200 focus:border-sky-300 focus:ring-1 focus:ring-sky-200";
const selectClass =
  "w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 appearance-none disabled:opacity-50";

const fieldTypeOptions = [
  { value: "text", label: "Văn bản" },
  { value: "textarea", label: "Văn bản dài" },
  { value: "select", label: "Lựa chọn" },
  { value: "date", label: "Ngày tháng" },
  { value: "file", label: "Tệp đính kèm" },
  { value: "number", label: "Số" },
];

interface EditFormWizardProps {
  formId: string;
}

export function EditFormWizard({ formId }: EditFormWizardProps) {
  const [formData, setFormData] = useState<Partial<FormTemplate> | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [form, wf, depts] = await Promise.all([
          apiClient.get<FormTemplate>(`/api/forms/${formId}`),
          apiClient.get<Workflow[]>("/api/workflows"),
          apiClient.get<Department[]>("/api/departments", {
            params: { status: "active" },
          }),
        ]);
        setFormData(form);
        setWorkflows(Array.isArray(wf) ? wf : []);
        setDepartments(Array.isArray(depts) ? depts : []);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải dữ liệu.",
          variant: "destructive",
        });
        router.push("/forms");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [formId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData?.name || formData.name.trim().length < 3)
      e.name = "Tên biểu mẫu phải có ít nhất 3 ký tự.";
    if (
      !formData?.category ||
      !departments.some((d) => d.name === formData?.category)
    )
      e.category = "Vui lòng chọn phòng ban hợp lệ.";
    if (!formData?.workflowId) e.workflowId = "Vui lòng chọn luồng phê duyệt.";
    if (!formData?.fields?.length)
      e.fields = "Biểu mẫu phải có ít nhất một trường.";
    else
      formData.fields.forEach((f, i) => {
        if (!f.label?.trim())
          e[`field-${i}-label`] = "Nhãn trường không được để trống.";
        if (
          f.type === "select" &&
          (!f.options?.length || f.options.some((o) => !o.trim()))
        )
          e[`field-${i}-options`] = "Cần ít nhất một lựa chọn.";
      });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const addField = () =>
    setFormData((p) =>
      p
        ? {
            ...p,
            fields: [
              ...(p.fields || []),
              {
                id: Date.now().toString(),
                label: "",
                type: "text",
                required: false,
              },
            ],
          }
        : p,
    );
  const removeField = (id: string) =>
    setFormData((p) =>
      p ? { ...p, fields: (p.fields || []).filter((f) => f.id !== id) } : p,
    );
  const updateField = (id: string, updates: Partial<FormField>) =>
    setFormData((p) =>
      p
        ? {
            ...p,
            fields: (p.fields || []).map((f) =>
              f.id === id ? { ...f, ...updates } : f,
            ),
          }
        : p,
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại thông tin.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.put(`/api/forms/${formId}`, {
        ...formData,
        workflowId:
          typeof formData?.workflowId === "object"
            ? (formData.workflowId as any)?._id
            : formData?.workflowId,
      });
      toast({ title: "Thành công", description: "Biểu mẫu đã được cập nhật!" });
      router.push("/forms");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="space-y-4 max-w-2xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingCard key={i} className="h-40" />
        ))}
      </div>
    );

  if (!formData)
    return (
      <div className="py-16 text-center">
        <p className="text-[13px] text-slate-400">Không tìm thấy biểu mẫu.</p>
      </div>
    );

  const currentWorkflowId =
    typeof formData.workflowId === "object"
      ? (formData.workflowId as any)?._id
      : formData.workflowId;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/forms")}
          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Chỉnh sửa biểu mẫu
          </h1>
          <p className="text-[12px] text-slate-400">{formData.name}</p>
        </div>
      </div>

      {/* Basic info */}
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
              value={formData.name || ""}
              onChange={(e) => {
                setFormData((p) => (p ? { ...p, name: e.target.value } : p));
                setErrors((p) => ({ ...p, name: "" }));
              }}
              disabled={isSaving}
              className={inputClass}
            />
            {errors.name && (
              <p className="text-[11px] text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12.5px] font-medium text-slate-600">
              Mô tả
            </Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((p) =>
                  p ? { ...p, description: e.target.value } : p,
                )
              }
              disabled={isSaving}
              rows={3}
              className="text-[13px] border-slate-200 focus:border-sky-300 focus:ring-sky-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12.5px] font-medium text-slate-600">
              Phòng ban <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <select
                value={formData.category || ""}
                onChange={(e) => {
                  setFormData((p) =>
                    p ? { ...p, category: e.target.value } : p,
                  );
                  setErrors((p) => ({ ...p, category: "" }));
                }}
                className={selectClass}
                disabled={isSaving || !departments.length}
              >
                <option value="">
                  {departments.length ? "Chọn phòng ban" : "Không có phòng ban"}
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
          <div className="space-y-1.5">
            <Label className="text-[12.5px] font-medium text-slate-600">
              Trạng thái
            </Label>
            <div className="relative">
              <select
                value={(formData as any).status || "active"}
                onChange={(e) =>
                  setFormData((p) =>
                    p ? { ...p, status: e.target.value as any } : p,
                  )
                }
                className={selectClass}
                disabled={isSaving}
              >
                <option value="active">Hoạt động</option>
                <option value="draft">Bản nháp</option>
                <option value="inactive">Không hoạt động</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-slate-700">
            Trường dữ liệu
          </h2>
          <Button
            type="button"
            onClick={addField}
            size="sm"
            disabled={isSaving}
            className="h-7 px-3 text-[12px] bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg gap-1"
          >
            <Plus className="h-3 w-3" /> Thêm trường
          </Button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {!formData.fields?.length ? (
            <p className="text-center py-6 text-[13px] text-slate-400">
              Chưa có trường nào. Nhấn "Thêm trường" để bắt đầu.
            </p>
          ) : (
            formData.fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/40"
              >
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
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
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
                      disabled={isSaving}
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
                      className="rounded border-slate-300"
                      disabled={isSaving}
                    />
                    Bắt buộc
                  </label>
                </div>
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
                      disabled={isSaving}
                    />
                    {errors[`field-${index}-options`] && (
                      <p className="text-[11px] text-red-500">
                        {errors[`field-${index}-options`]}
                      </p>
                    )}
                  </div>
                )}
                {field.type === "number" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">
                        Tối thiểu
                      </Label>
                      <Input
                        type="text"
                        value={field.validation?.min ?? ""}
                        onChange={(e) =>
                          updateField(field.id, {
                            validation: {
                              ...field.validation,
                              min:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            },
                          })
                        }
                        placeholder="Không giới hạn"
                        className={`${inputClass} font-mono`}
                        disabled={isSaving}
                      />
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
                        }}
                        placeholder="Không giới hạn"
                        className={`${inputClass} font-mono`}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {errors.fields && (
            <p className="text-[11px] text-red-500">{errors.fields}</p>
          )}
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
          <h2 className="text-[13px] font-semibold text-slate-700">
            Luồng phê duyệt <span className="text-red-400">*</span>
          </h2>
        </div>
        <div className="px-5 py-4 space-y-2.5">
          {workflows.length === 0 ? (
            <p className="text-[13px] text-slate-400">
              Chưa có luồng phê duyệt nào.
            </p>
          ) : (
            workflows.map((wf) => (
              <div
                key={wf._id}
                className={cn(
                  "border rounded-xl px-4 py-3 cursor-pointer transition-all duration-150",
                  currentWorkflowId === wf._id
                    ? "border-sky-300 bg-sky-50/50"
                    : "border-slate-100 hover:border-slate-200",
                )}
                onClick={() => {
                  setFormData((p) => (p ? { ...p, workflowId: wf._id } : p));
                  setErrors((p) => ({ ...p, workflowId: "" }));
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border-2 transition-all flex-shrink-0",
                      currentWorkflowId === wf._id
                        ? "border-sky-500 bg-sky-500"
                        : "border-slate-300",
                    )}
                  />
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">
                      {wf.name}
                    </p>
                    {wf.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {wf.description}
                      </p>
                    )}
                  </div>
                </div>
                {currentWorkflowId === wf._id && wf.steps?.length > 0 && (
                  <div className="mt-2 ml-6 space-y-1">
                    {wf.steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-[11.5px] text-slate-500"
                      >
                        <span className="h-4 w-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-400">
                          {i + 1}
                        </span>
                        {(step.roleId as Role)?.displayName || "N/A"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {errors.workflowId && (
            <p className="text-[11px] text-red-500">{errors.workflowId}</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-9 px-5 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg gap-2"
        >
          <Save className="h-3.5 w-3.5" />
          <ButtonLoading isLoading={isSaving} loadingText="Đang lưu...">
            Lưu thay đổi
          </ButtonLoading>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/forms")}
          disabled={isSaving}
          className="h-9 px-4 text-[13px] text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Hủy
        </Button>
      </div>
    </form>
  );
}
