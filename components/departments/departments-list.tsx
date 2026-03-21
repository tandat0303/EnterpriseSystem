"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingCard, LoadingSpinner } from "@/components/ui/loading";
import { Search, Edit, Trash2, Building, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type { Department, User } from "@/types";
import { ViewToggleButton } from "@/components/ui/view-toggle-button";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: {
    label: "Hoạt động",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  inactive: {
    label: "Không hoạt động",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

const selectClass =
  "h-9 pl-3 pr-8 text-[12.5px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 appearance-none cursor-pointer";

export function DepartmentsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const router = useRouter();
  const { toast } = useToast();

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.includeInactive = "true";
      if (searchTerm) params.searchTerm = searchTerm;
      const data: Department[] = await apiClient.get("/api/departments", {
        params,
      });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải phòng ban.",
        variant: "destructive",
      });
      setDepartments([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm !== "") setIsSearching(true);
      fetchDepartments();
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa phòng ban "${name}"?`)) return;
    try {
      await apiClient.delete(`/api/departments/${id}`);
      toast({
        title: "Đã xóa",
        description: `Phòng ban "${name}" đã được xóa.`,
      });
      fetchDepartments();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingCard key={i} className="h-14" />
        ))}
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl border border-slate-100 px-4 py-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          {isSearching && (
            <LoadingSpinner
              size="sm"
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
          )}
          <Input
            placeholder="Tìm kiếm phòng ban..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-[12.5px] border-slate-200 focus:border-sky-300 focus:ring-sky-200"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
        <ViewToggleButton viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-[13px] text-slate-500">
            Không tìm thấy phòng ban nào
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <div className="grid grid-cols-[1fr_80px_140px_120px_100px] gap-4 px-5 py-3 bg-slate-50/60">
            {["Tên phòng ban", "Mã", "Trưởng phòng", "Ngày tạo", ""].map(
              (h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </span>
              ),
            )}
          </div>
          {departments.map((dept) => {
            const status =
              statusConfig[dept.status as keyof typeof statusConfig];
            return (
              <div
                key={dept._id}
                className="grid grid-cols-[1fr_80px_140px_120px_100px] gap-4 items-center px-5 py-3.5 hover:bg-slate-50/50 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Building className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <p className="text-[13px] font-medium text-slate-800 truncate">
                      {dept.name}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border mt-1 ml-8",
                      status?.className,
                    )}
                  >
                    {status?.label}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 font-mono">
                  {dept.code || "—"}
                </p>
                <p className="text-[12px] text-slate-500 truncate">
                  {(dept.managerId as User)?.name || "Chưa có"}
                </p>
                <p className="text-[12px] text-slate-400">
                  {new Date(dept.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => router.push(`/departments/${dept._id}/edit`)}
                    className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept._id, dept.name)}
                    className="h-7 w-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const status =
              statusConfig[dept.status as keyof typeof statusConfig];
            return (
              <div
                key={dept._id}
                className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Building className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      status?.className,
                    )}
                  >
                    {status?.label}
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-slate-800 mb-0.5">
                  {dept.name}
                </p>
                {dept.code && (
                  <p className="text-[11px] font-mono text-slate-400 mb-3">
                    {dept.code}
                  </p>
                )}
                <div className="space-y-1 text-[11.5px] mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trưởng phòng</span>
                    <span className="text-slate-600 font-medium">
                      {(dept.managerId as User)?.name || "Chưa có"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ngày tạo</span>
                    <span className="text-slate-600">
                      {new Date(dept.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                {dept.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                    {dept.description}
                  </p>
                )}
                <div className="flex gap-1.5 pt-3 border-t border-slate-50">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/departments/${dept._id}/edit`)}
                    className="flex-1 h-7 text-[11.5px] text-slate-600 hover:bg-slate-100 rounded-lg gap-1"
                  >
                    <Edit className="h-3 w-3" /> Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(dept._id, dept.name)}
                    className="h-7 px-2 text-[11.5px] text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
