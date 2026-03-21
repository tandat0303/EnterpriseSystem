"use client";

import { useState, useEffect } from "react";
import { Clock, Filter } from "lucide-react";
import { LoadingCard } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type { AuditLog, User } from "@/types";
import { ViewToggleButton } from "@/components/ui/view-toggle-button";
import { cn } from "@/lib/utils";

const resourceTypeLabels: Record<string, string> = {
  FormTemplate: "Biểu mẫu",
  FormSubmission: "Đơn gửi",
  User: "Người dùng",
  Workflow: "Luồng phê duyệt",
  Department: "Phòng ban",
  Setting: "Cài đặt",
  Role: "Vai trò",
  Permission: "Quyền hạn",
  System: "Hệ thống",
};

const actionConfig: Record<string, { label: string; className: string }> = {
  create: {
    label: "Tạo mới",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  update: {
    label: "Cập nhật",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  delete: { label: "Xóa", className: "bg-red-50 text-red-700 border-red-200" },
  approve: {
    label: "Phê duyệt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  reject: {
    label: "Từ chối",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  submit: {
    label: "Gửi",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  login: {
    label: "Đăng nhập",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  logout: {
    label: "Đăng xuất",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export function AuditLogsList() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState("all");
  const [filterResourceType, setFilterResourceType] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const { toast } = useToast();

  useEffect(() => {
    apiClient
      .get("/api/users")
      .then((data: User[]) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filterUserId !== "all") params.userId = filterUserId;
        if (filterResourceType !== "all")
          params.resourceType = filterResourceType;
        if (filterAction !== "all") params.action = filterAction;
        const data: AuditLog[] = await apiClient.get("/api/audit-logs", {
          params,
        });
        setAuditLogs(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải nhật ký.",
          variant: "destructive",
        });
        setAuditLogs([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [filterUserId, filterResourceType, filterAction]);

  const selectClass =
    "h-9 px-3 text-[12.5px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 appearance-none cursor-pointer";

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingCard key={i} className="h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nhật ký hệ thống</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {auditLogs.length} bản ghi
          </p>
        </div>
        <ViewToggleButton viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl border border-slate-100 px-4 py-3">
        <Filter className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <select
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          className={selectClass}
        >
          <option value="all">Tất cả người dùng</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={filterResourceType}
          onChange={(e) => setFilterResourceType(e.target.value)}
          className={selectClass}
        >
          <option value="all">Tất cả tài nguyên</option>
          {Object.entries(resourceTypeLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className={selectClass}
        >
          <option value="all">Tất cả hành động</option>
          {Object.entries(actionConfig).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Logs */}
      {auditLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center">
          <p className="text-[13px] text-slate-400">
            Không tìm thấy nhật ký nào.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <div className="grid grid-cols-[100px_120px_1fr_140px_120px] gap-4 px-5 py-3 bg-slate-50/60">
            {[
              "Hành động",
              "Tài nguyên",
              "Mô tả",
              "Người dùng",
              "Thời gian",
            ].map((h) => (
              <span
                key={h}
                className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
              >
                {h}
              </span>
            ))}
          </div>
          {auditLogs.map((log) => {
            const action = actionConfig[log.action] ?? {
              label: log.action,
              className: "bg-slate-100 text-slate-600 border-slate-200",
            };
            return (
              <div
                key={log._id}
                className="grid grid-cols-[100px_120px_1fr_140px_120px] gap-4 items-center px-5 py-3 hover:bg-slate-50/50 transition-colors"
              >
                <span
                  className={cn(
                    "inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border",
                    action.className,
                  )}
                >
                  {action.label}
                </span>
                <span className="text-[12px] text-slate-600">
                  {resourceTypeLabels[log.resourceType] || log.resourceType}
                </span>
                <span className="text-[12px] text-slate-700 truncate">
                  {log.description}
                </span>
                <span className="text-[12px] text-slate-500 truncate">
                  {(log.userId as User)?.name ||
                    (log.userId === "system" ? "Hệ thống" : "Ẩn danh")}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  {new Date(log.createdAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {auditLogs.map((log) => {
            const action = actionConfig[log.action] ?? {
              label: log.action,
              className: "bg-slate-100 text-slate-600 border-slate-200",
            };
            return (
              <div
                key={log._id}
                className="bg-white rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      action.className,
                    )}
                  >
                    {action.label}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-slate-800 mb-1">
                  {log.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {resourceTypeLabels[log.resourceType] || log.resourceType}
                  </span>
                  <span>{(log.userId as User)?.name || "Ẩn danh"}</span>
                </div>
                {log.ipAddress && (
                  <p className="text-[10px] text-slate-300 mt-1">
                    IP: {log.ipAddress}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
