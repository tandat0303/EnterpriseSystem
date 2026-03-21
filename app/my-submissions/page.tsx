"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Eye, Plus, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { FormSubmission, FormTemplate } from "@/types";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Đang chờ",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Đã từ chối",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  feedback_requested: {
    label: "Cần phản hồi",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

const priorityConfig = {
  high: { label: "Cao", dot: "bg-red-400" },
  medium: { label: "Trung bình", dot: "bg-amber-400" },
  low: { label: "Thấp", dot: "bg-emerald-400" },
};

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const fetchMySubmissions = async () => {
      if (!user?._id) {
        if (!isAuthLoading) {
          router.push("/auth/login");
        }
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/submissions?submitterId=${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          },
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data: FormSubmission[] = await response.json();
        setSubmissions(data);
      } catch {
        toast({
          title: "Lỗi",
          description: "Không thể tải lịch sử gửi biểu mẫu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (!isAuthLoading) fetchMySubmissions();
  }, [user, isAuthLoading]);

  if (isLoading || isAuthLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Lịch sử gửi biểu mẫu
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {submissions.length} biểu mẫu đã gửi
            </p>
          </div>
          <Button
            onClick={() => router.push("/submit-form")}
            className="h-9 px-4 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Gửi mới
          </Button>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-[14px] font-medium text-slate-600">
              Bạn chưa gửi biểu mẫu nào
            </p>
            <p className="text-[12px] text-slate-400 mt-1 mb-5">
              Hãy bắt đầu bằng cách gửi biểu mẫu đầu tiên!
            </p>
            <Button
              onClick={() => router.push("/submit-form")}
              className="h-9 px-4 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Gửi biểu mẫu mới
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
            <div className="grid grid-cols-[1fr_120px_100px_80px] gap-4 px-5 py-3 bg-slate-50/60">
              {["Biểu mẫu", "Ngày gửi", "Ưu tiên", ""].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </span>
              ))}
            </div>
            {submissions.map((s) => {
              const status =
                statusConfig[s.status as keyof typeof statusConfig];
              const priority =
                priorityConfig[s.priority as keyof typeof priorityConfig] ??
                priorityConfig.medium;
              return (
                <div
                  key={s._id}
                  className="grid grid-cols-[1fr_120px_100px_80px] gap-4 items-center px-5 py-3.5 hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">
                      {(s.formTemplateId as FormTemplate)?.name ||
                        "Biểu mẫu không tên"}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border mt-1",
                        status?.className,
                      )}
                    >
                      {status?.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500">
                    {format(new Date(s.createdAt), "dd/MM/yyyy")}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                        priority.dot,
                      )}
                    />
                    <span className="text-[12px] text-slate-500">
                      {priority.label}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/my-submissions/${s._id}`)}
                      className="h-7 px-3 text-[12px] text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Xem
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
