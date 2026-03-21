"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  FileText,
  Clock,
  Download,
  Users,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import type {
  FormSubmission,
  FormField,
  User as UserType,
  FormTemplate,
  WorkflowInstanceStep,
} from "@/types";
import {
  LoadingCard,
  LoadingSkeleton,
  ButtonLoading,
} from "@/components/ui/loading";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ApprovalDetailProps {
  approvalId: string;
}

const statusConfig = {
  pending: {
    label: "Chờ duyệt",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  feedback_requested: {
    label: "Yêu cầu phản hồi",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

const stepStatusConfig = {
  approved: {
    label: "Hoàn thành",
    className: "bg-emerald-50 text-emerald-700",
  },
  rejected: { label: "Từ chối", className: "bg-red-50 text-red-700" },
  feedback: { label: "Phản hồi", className: "bg-sky-50 text-sky-700" },
  pending: { label: "Đang chờ", className: "bg-amber-50 text-amber-700" },
  idle: { label: "Chưa bắt đầu", className: "bg-slate-100 text-slate-500" },
};

const priorityConfig = {
  high: { label: "Cao", dot: "bg-red-400" },
  medium: { label: "Trung bình", dot: "bg-amber-400" },
  low: { label: "Thấp", dot: "bg-emerald-400" },
};

const actionIcons = {
  approve: Check,
  reject: X,
  feedback: MessageSquare,
  submitted: FileText,
};
const actionLabels = {
  approve: "Duyệt",
  reject: "Từ chối",
  feedback: "Phản hồi",
  submitted: "Gửi",
};

export function ApprovalDetail({ approvalId }: ApprovalDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        setSubmission(await apiClient.get(`/api/submissions/${approvalId}`));
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin phê duyệt.",
          variant: "destructive",
        });
        router.push("/approvals");
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [approvalId]);

  const handleAction = async (action: "approve" | "reject" | "feedback") => {
    if (!user || !submission) return;
    setActionLoading(action);
    try {
      const response = await apiClient.post(
        `/api/submissions/${submission._id}/action`,
        {
          action,
          comment:
            action === "feedback" && !comment
              ? "Phản hồi không có nội dung"
              : comment,
          approverId: user._id,
        },
      );
      setSubmission(response);
      toast({
        title: "Thành công",
        description: `Yêu cầu đã được ${action === "approve" ? "duyệt" : action === "reject" ? "từ chối" : "gửi phản hồi"}.`,
      });
      setComment("");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-9 w-24 bg-slate-100 rounded-lg animate-pulse" />
          <LoadingSkeleton className="h-7 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <LoadingCard className="h-40" />
            <LoadingCard className="h-56" />
          </div>
          <div className="space-y-4">
            <LoadingCard className="h-40" />
            <LoadingCard className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!submission?.formTemplateId || !submission?.submitterId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center text-center">
        <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
        <p className="text-[13px] text-slate-500">
          Dữ liệu không đầy đủ hoặc không tìm thấy.
        </p>
      </div>
    );
  }

  const formTemplate = submission.formTemplateId as FormTemplate;
  const submitter = submission.submitterId as UserType;
  const workflowSteps = formTemplate.workflowId?.steps || [];
  const workflowInstance = submission.workflowInstance || [];

  const currentStepDetails = workflowSteps[submission.currentStep];
  const currentInstanceStep = workflowInstance[submission.currentStep];
  const isCurrentApprover =
    user &&
    currentStepDetails &&
    currentInstanceStep &&
    ((currentInstanceStep.approverId &&
      (currentInstanceStep.approverId._id?.toString() ||
        currentInstanceStep.approverId.toString()) === user._id.toString()) ||
      (!currentInstanceStep.approverId &&
        user.roleId ===
          (currentStepDetails.roleId?._id?.toString() ||
            currentStepDetails.roleId) &&
        user.departmentId?._id?.toString() ===
          submitter.departmentId?._id?.toString()));
  const canApprove = submission.status === "pending" && isCurrentApprover;

  const status = statusConfig[submission.status as keyof typeof statusConfig];
  const priority =
    priorityConfig[submission.priority as keyof typeof priorityConfig];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/approvals")}
            className="h-8 px-3 text-[12.5px] text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại
          </Button>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {formTemplate?.name || "Biểu mẫu"}
            </h1>
            <p className="text-[12px] text-slate-500">
              Yêu cầu của {submitter?.name}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center text-[11px] font-medium px-3 py-1 rounded-full border",
            status?.className,
          )}
        >
          {status?.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: submission info + form data */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info card */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
              <h2 className="text-[13px] font-semibold text-slate-700">
                Thông tin yêu cầu
              </h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                ["Người gửi", submitter?.name || "N/A"],
                ["Phòng ban", submitter?.departmentId?.name || "N/A"],
                [
                  "Ngày gửi",
                  new Date(submission.createdAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }),
                ],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <p className="text-[11px] text-slate-400 mb-0.5">{lbl}</p>
                  <p className="text-[13px] font-medium text-slate-800">
                    {val}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">Ưu tiên</p>
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn("h-1.5 w-1.5 rounded-full", priority?.dot)}
                  />
                  <p className="text-[13px] font-medium text-slate-800">
                    {priority?.label}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form data */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
              <h2 className="text-[13px] font-semibold text-slate-700">
                Dữ liệu biểu mẫu
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {formTemplate?.fields?.length > 0 ? (
                formTemplate.fields.map((field: FormField) => {
                  const raw =
                    submission.data[field.id] ||
                    submission.data[field.name] ||
                    "";
                  let val = raw;
                  if (field.type === "date" && raw) {
                    val = new Date(raw).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });
                  }
                  return (
                    <div
                      key={field.id}
                      className="px-5 py-3 flex items-start gap-4"
                    >
                      <p className="text-[12px] text-slate-400 w-36 flex-shrink-0 mt-0.5">
                        {field.label || field.name}
                      </p>
                      {field.type === "file" ? (
                        submission.data[field.id]?.fileUrl ? (
                          <a
                            href={submission.data[field.id].fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] text-sky-600 hover:underline flex items-center gap-1"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {submission.data[field.id].fileName ||
                              "Tệp đính kèm"}
                          </a>
                        ) : (
                          <p className="text-[12px] text-slate-400">
                            Không có tệp
                          </p>
                        )
                      ) : (
                        <p className="text-[13px] text-slate-800">
                          {val || <span className="text-slate-300">—</span>}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="px-5 py-4 text-[13px] text-slate-400">
                  Không có trường dữ liệu.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: workflow + history + actions */}
        <div className="space-y-4">
          {/* Workflow steps */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40 flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <h2 className="text-[13px] font-semibold text-slate-700">
                Luồng phê duyệt
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-[11px] text-slate-400">Tên luồng</p>
                <p className="text-[13px] font-medium text-slate-800 mt-0.5">
                  {formTemplate.workflowId?.name || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                {workflowSteps.length > 0 ? (
                  workflowSteps.map((step, i) => {
                    const inst = workflowInstance[i];
                    const s =
                      inst?.status === "approved"
                        ? "approved"
                        : inst?.status === "rejected"
                          ? "rejected"
                          : inst?.status === "feedback"
                            ? "feedback"
                            : i === submission.currentStep
                              ? "pending"
                              : "idle";
                    const cfg = stepStatusConfig[s];
                    return (
                      <div
                        key={step._id || i}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-[12px]",
                          cfg.className,
                        )}
                      >
                        <span>
                          Bước {i + 1}: {step.roleId?.displayName || "N/A"}
                        </span>
                        <span className="text-[10px] font-medium opacity-70">
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[12px] text-slate-400">
                    Không có bước nào.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Approval history */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
              <h2 className="text-[13px] font-semibold text-slate-700">
                Lịch sử phê duyệt
              </h2>
            </div>
            <div className="px-5 py-4">
              {submission.approvalHistory.length > 0 ? (
                <div className="space-y-3">
                  {submission.approvalHistory.map((h, i) => {
                    const IconComp =
                      actionIcons[h.action as keyof typeof actionIcons] ??
                      FileText;
                    const iconColor =
                      h.action === "approve"
                        ? "text-emerald-500"
                        : h.action === "reject"
                          ? "text-red-500"
                          : h.action === "feedback"
                            ? "text-sky-500"
                            : "text-slate-400";
                    return (
                      <div key={i} className="flex gap-3">
                        <div
                          className={cn(
                            "h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5",
                            iconColor,
                          )}
                        >
                          <IconComp className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-slate-800">
                            {(h.approverId as any)?.name || "Hệ thống"} ·{" "}
                            {
                              actionLabels[
                                h.action as keyof typeof actionLabels
                              ]
                            }
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {new Date(h.timestamp).toLocaleString("vi-VN")}
                          </p>
                          {h.comment && (
                            <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 rounded-md px-2 py-1">
                              "{h.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-slate-400">
                  Chưa có lịch sử phê duyệt.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {canApprove ? (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
                <h2 className="text-[13px] font-semibold text-slate-700">
                  Hành động phê duyệt
                </h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <Label
                    htmlFor="comment"
                    className="text-[12px] font-medium text-slate-600"
                  >
                    Lý do (nếu từ chối hoặc phản hồi)
                  </Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Nhập lý do..."
                    rows={3}
                    disabled={!!actionLoading}
                    className="mt-1.5 text-[12.5px] border-slate-200 focus:border-sky-300 focus:ring-sky-200"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAction("approve")}
                    disabled={!!actionLoading}
                    className="flex-1 h-8 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1.5"
                  >
                    <ButtonLoading
                      isLoading={actionLoading === "approve"}
                      loadingText="..."
                    >
                      <Check className="h-3.5 w-3.5" /> Duyệt
                    </ButtonLoading>
                  </Button>
                  <Button
                    onClick={() => handleAction("reject")}
                    disabled={!!actionLoading}
                    className="flex-1 h-8 text-[12px] bg-red-500 hover:bg-red-600 text-white rounded-lg gap-1.5"
                  >
                    <ButtonLoading
                      isLoading={actionLoading === "reject"}
                      loadingText="..."
                    >
                      <X className="h-3.5 w-3.5" /> Từ chối
                    </ButtonLoading>
                  </Button>
                  <Button
                    onClick={() => handleAction("feedback")}
                    disabled={!!actionLoading}
                    className="flex-1 h-8 text-[12px] bg-sky-600 hover:bg-sky-700 text-white rounded-lg gap-1.5"
                  >
                    <ButtonLoading
                      isLoading={actionLoading === "feedback"}
                      loadingText="..."
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Phản hồi
                    </ButtonLoading>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
              <p className="text-[12px] text-amber-700">
                Bạn không có quyền thực hiện hành động phê duyệt tại bước này.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
