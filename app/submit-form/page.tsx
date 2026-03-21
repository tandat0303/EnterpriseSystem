"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FormRenderer } from "@/components/forms/form-renderer";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import type { FormTemplate, FormFieldOption } from "@/types";
import { Label } from "@/components/ui/label";
import { ChevronDown, Send } from "lucide-react";

const priorityOptions = [
  { value: "low", label: "Thấp", dot: "bg-emerald-400" },
  { value: "medium", label: "Trung bình", dot: "bg-amber-400" },
  { value: "high", label: "Cao", dot: "bg-red-400" },
];

const selectClass =
  "w-full h-10 pl-3 pr-9 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 appearance-none cursor-pointer";

export default function SubmitFormPage() {
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    null,
  );
  const [priority, setPriority] = useState("medium");
  const [priorityError, setPriorityError] = useState("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 100)
      console.error("Possible infinite render loop detected!");
  });

  const stableFormTemplates = useMemo(
    () =>
      formTemplates.map((t) => ({
        ...t,
        fields: (t.fields ?? []).map((f) => ({
          ...f,
          options:
            f.type === "select"
              ? (f.options ?? [])
                  .map((o) =>
                    typeof o === "string" ? o : (o as FormFieldOption).value,
                  )
                  .filter((o) => o && typeof o === "string" && o.trim())
              : f.options,
        })),
      })),
    [formTemplates],
  );

  const stableFields = useMemo(
    () => selectedTemplate?.fields ?? [],
    [selectedTemplate?.fields],
  );

  useEffect(() => {
    const fetch = async () => {
      setIsLoadingTemplates(true);
      try {
        setFormTemplates(await apiClient.get("/api/forms?status=active"));
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải biểu mẫu.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetch();
  }, [toast]);

  useEffect(() => {
    if (selectedTemplateId) {
      const t = stableFormTemplates.find((t) => t._id === selectedTemplateId);
      if (t && t._id !== selectedTemplate?._id) {
        setSelectedTemplate(t);
        setPriority("medium");
        setPriorityError("");
      }
    } else if (selectedTemplate !== null) {
      setSelectedTemplate(null);
      setPriority("medium");
      setPriorityError("");
    }
  }, [selectedTemplateId, stableFormTemplates, selectedTemplate?._id]);

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!selectedTemplateId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn biểu mẫu.",
        variant: "destructive",
      });
      return;
    }
    if (!user?._id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập lại.",
        variant: "destructive",
      });
      return;
    }
    if (!["low", "medium", "high"].includes(priority)) {
      setPriorityError("Vui lòng chọn mức ưu tiên hợp lệ.");
      return;
    }
    const cleaned = Object.fromEntries(
      Object.entries(formData).filter(
        ([, v]) => v !== null && v !== undefined && v !== "",
      ),
    );
    if (!Object.keys(cleaned).length) {
      toast({
        title: "Lỗi",
        description: "Dữ liệu biểu mẫu không hợp lệ.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingForm(true);
    try {
      await apiClient.post("/api/submissions", {
        formTemplateId: selectedTemplateId,
        data: cleaned,
        priority,
        createdBy: user._id,
      });
      toast({
        title: "Thành công",
        description: "Biểu mẫu đã được gửi để phê duyệt.",
      });
      router.push("/my-submissions");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi gửi biểu mẫu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const selectedPriority = priorityOptions.find((p) => p.value === priority);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gửi biểu mẫu mới</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Chọn biểu mẫu và điền thông tin cần thiết
          </p>
        </div>

        {/* Form select card */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
            <h2 className="text-[13px] font-semibold text-slate-700">
              Chọn biểu mẫu
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {isLoadingTemplates ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-medium text-slate-600">
                  Loại biểu mẫu <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <select
                    value={selectedTemplateId || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (
                        v &&
                        v !== selectedTemplateId &&
                        stableFormTemplates.some((t) => t._id === v)
                      )
                        setSelectedTemplateId(v);
                      else if (!v) setSelectedTemplateId(null);
                    }}
                    className={selectClass}
                  >
                    <option value="">Chọn một biểu mẫu...</option>
                    {formTemplates.length === 0 ? (
                      <option disabled>Không có biểu mẫu khả dụng</option>
                    ) : (
                      formTemplates.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected template form */}
        {selectedTemplate && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40 flex items-start justify-between">
              <div>
                <h2 className="text-[13px] font-semibold text-slate-800">
                  {selectedTemplate.name}
                </h2>
                {selectedTemplate.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>
              {/* Priority inline */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Label className="text-[11px] text-slate-500 whitespace-nowrap">
                  Ưu tiên
                </Label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      setPriorityError("");
                    }}
                    className="h-8 pl-6 pr-7 text-[12px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 appearance-none cursor-pointer"
                  >
                    {priorityOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div
                    className={`absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full pointer-events-none ${selectedPriority?.dot}`}
                  />
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            {priorityError && (
              <p className="px-5 pt-2 text-[11px] text-red-500">
                {priorityError}
              </p>
            )}
            <div className="px-5 py-4">
              <FormRenderer
                fields={stableFields}
                onSubmit={handleSubmit}
                submitButtonText={
                  isSubmittingForm ? "Đang gửi..." : "Gửi biểu mẫu"
                }
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
