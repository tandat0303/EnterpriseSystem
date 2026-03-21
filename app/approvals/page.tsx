"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Eye, Clock, AlertCircle, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import type { FormSubmission, FormTemplate, User } from "@/types";
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

export default function ApprovalsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      if (!user?._id || !user?.role) {
        if (!isAuthLoading) {
          router.push("/auth/login");
        }
        return;
      }
      setIsLoading(true);
      try {
        const data: FormSubmission[] = await apiClient.get(
          "/api/submissions?forApproval=true",
        );
        setSubmissions(data);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách phê duyệt.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (!isAuthLoading) fetch();
  }, [user, isAuthLoading]);

  if (isLoading || isAuthLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Biểu mẫu cần phê duyệt
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {submissions.length > 0
                ? `${submissions.length} biểu mẫu đang chờ xử lý`
                : "Không có biểu mẫu nào đang chờ"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Content */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-[14px] font-medium text-slate-600">
              Không có biểu mẫu nào đang chờ phê duyệt
            </p>
            <p className="text-[12px] text-slate-400 mt-1">
              Tuyệt vời! Mọi thứ đều được xử lý.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px_120px_100px_100px] gap-4 px-5 py-3 bg-slate-50/60">
              {["Biểu mẫu", "Người gửi", "Ngày gửi", "Ưu tiên", ""].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </span>
              ))}
            </div>
            {/* Rows */}
            {submissions.map((s) => {
              const status =
                statusConfig[s.status as keyof typeof statusConfig];
              const priority =
                priorityConfig[s.priority as keyof typeof priorityConfig] ??
                priorityConfig.medium;
              return (
                <div
                  key={s._id}
                  className="grid grid-cols-[1fr_140px_120px_100px_100px] gap-4 items-center px-5 py-3.5 hover:bg-slate-50/50 transition-colors duration-100 group"
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
                  <p className="text-[12px] text-slate-500 truncate">
                    {(s.submitterId as User)?.name || "N/A"}
                  </p>
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
                      onClick={() => router.push(`/approvals/${s._id}`)}
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
