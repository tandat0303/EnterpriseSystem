"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Edit,
  ArrowLeft,
  FileText,
  Layers,
  Workflow,
  Info,
  AlertCircle,
} from "lucide-react";
import type {
  FormTemplate,
  Workflow as WorkflowType,
  Role,
  FormField,
  Department,
} from "@/types";
import { LoadingCard } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

const fieldTypeLabels: Record<string, string> = {
  text: "Văn bản",
  textarea: "Văn bản dài",
  select: "Lựa chọn",
  date: "Ngày tháng",
  file: "Tệp đính kèm",
  number: "Số",
};

export function FormDetail({ formId }: { formId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [formData, deptsData] = await Promise.all([
          apiClient.get(`/api/forms/${formId}`),
          apiClient.get<Department[]>("/api/departments", {
            params: { status: "active" },
          }),
        ]);
        setForm(formData);
        setDepartments(Array.isArray(deptsData) ? deptsData : []);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin.",
          variant: "destructive",
        });
        router.push("/forms");
      } finally {
        setIsLoading(false);
      }
    };
    if (formId) load();
  }, [formId]);

  const handleDelete = async () => {
    if (!confirm("Xóa biểu mẫu này? Hành động không thể hoàn tác.")) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/forms/${formId}`);
      toast({ title: "Thành công", description: "Biểu mẫu đã được xóa." });
      router.push("/forms");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (isLoading)
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-9 w-48 bg-slate-100 rounded-xl animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingCard key={i} className="h-40" />
        ))}
      </div>
    );

  if (!form)
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center text-center">
        <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
        <p className="text-[13px] text-slate-500">Không tìm thấy biểu mẫu.</p>
      </div>
    );

  const workflow =
    typeof form.workflowId === "object" && form.workflowId
      ? (form.workflowId as WorkflowType)
      : null;
  const statusConfig = {
    active: {
      label: "Hoạt động",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    draft: {
      label: "Bản nháp",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    inactive: {
      label: "Không hoạt động",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  };
  const status = statusConfig[form.status as keyof typeof statusConfig];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/forms")}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{form.name}</h1>
            <span
              className={cn(
                "inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border mt-0.5",
                status?.className,
              )}
            >
              {status?.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/forms/${formId}/edit`)}
            className="h-8 px-3 text-[12.5px] text-slate-600 hover:bg-slate-100 rounded-lg gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" /> Chỉnh sửa
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 px-3 text-[12.5px] text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40 flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-700">
            Thông tin cơ bản
          </h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Tên biểu mẫu</p>
            <p className="text-[13px] font-medium text-slate-800">
              {form.name}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Danh mục</p>
            <p className="text-[13px] font-medium text-slate-800">
              {departments.find((d) => d.name === form.category)?.name ||
                form.category ||
                "—"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] text-slate-400 mb-0.5">Mô tả</p>
            <p className="text-[13px] text-slate-700">
              {form.description || "Không có mô tả."}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Ngày tạo</p>
            <p className="text-[13px] text-slate-700">
              {new Date(form.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Người tạo</p>
            <p className="text-[13px] text-slate-700">
              {(form.createdBy as any)?.name || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40 flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-700">
            Trường dữ liệu
          </h2>
          <span className="text-[11px] text-slate-400 ml-auto">
            {form.fields?.length ?? 0} trường
          </span>
        </div>
        {form.fields?.length ? (
          <div className="divide-y divide-slate-50">
            {form.fields.map((field: FormField, i: number) => (
              <div
                key={field.id}
                className="px-5 py-3.5 flex items-start gap-4"
              >
                <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-medium text-slate-800">
                      {field.label}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-full">
                      {fieldTypeLabels[field.type] || field.type}
                    </span>
                    {field.required && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded-full">
                        Bắt buộc
                      </span>
                    )}
                  </div>
                  {field.type === "select" && field.options?.length && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Lựa chọn: {field.options.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-4 text-[13px] text-slate-400">
            Không có trường dữ liệu.
          </p>
        )}
      </div>

      {/* Workflow */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40 flex items-center gap-2">
          <Workflow className="h-3.5 w-3.5 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-700">
            Luồng phê duyệt
          </h2>
        </div>
        <div className="px-5 py-4">
          {workflow ? (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-slate-400">Tên luồng</p>
                <p className="text-[13px] font-medium text-slate-800 mt-0.5">
                  {workflow.name}
                </p>
              </div>
              {workflow.description && (
                <div>
                  <p className="text-[11px] text-slate-400">Mô tả</p>
                  <p className="text-[13px] text-slate-700 mt-0.5">
                    {workflow.description}
                  </p>
                </div>
              )}
              {workflow.steps?.length ? (
                <div className="space-y-1.5 mt-2">
                  {workflow.steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg"
                    >
                      <span className="h-5 w-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-[12.5px] text-slate-700">
                        {(step.roleId as Role)?.displayName || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[13px] text-slate-400">
              Chưa có luồng phê duyệt.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
