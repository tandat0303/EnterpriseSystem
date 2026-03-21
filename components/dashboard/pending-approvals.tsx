"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/ui/loading";
import type { FormSubmission } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";

export function PendingApprovals() {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<FormSubmission[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await apiClient.get<FormSubmission[]>(
          "/api/submissions",
          {
            params: {
              currentUserRoleId: user.roleId?.toString() ?? "",
              currentUserDepartment: user.departmentId?.toString() ?? "",
              currentUserId: user._id.toString(),
            },
          },
        );
        setPendingApprovals(
          response
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .slice(0, 5),
        );
      } catch {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách phê duyệt.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPendingApprovals();
  }, [toast, user]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <h3 className="text-[13px] font-semibold text-slate-800">
            Phê duyệt đang chờ
          </h3>
        </div>
        {!isLoading && pendingApprovals.length > 0 && (
          <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            {pendingApprovals.length} chờ xử lý
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-3">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} lines={2} className="h-10" />
            ))}
          </div>
        ) : pendingApprovals.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {pendingApprovals.map((approval) => (
              <div
                key={approval._id}
                className="flex items-center justify-between py-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">
                      {(approval.formTemplateId as any)?.name ||
                        "Biểu mẫu không tên"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(approval.submitterId as any)?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/approvals/${approval._id}`)}
                  className="h-7 px-2.5 text-[12px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                >
                  Xem <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
              <AlertCircle className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-[13px] text-slate-400">
              Không có phê duyệt nào đang chờ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
