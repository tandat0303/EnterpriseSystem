"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingCard, LoadingSpinner } from "@/components/ui/loading";
import { Search, Edit, Trash2, Eye, FileText, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type { FormTemplate, Workflow, User, Department } from "@/types";
import { ViewToggleButton } from "@/components/ui/view-toggle-button";
import { cn } from "@/lib/utils";

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

const selectClass =
  "h-9 pl-3 pr-8 text-[12.5px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 appearance-none cursor-pointer";

export function FormsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const router = useRouter();
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchTerm) params.searchTerm = searchTerm;
      const [formsData, deptsData] = await Promise.all([
        apiClient.get<FormTemplate[]>("/api/forms", { params }),
        apiClient.get<Department[]>("/api/departments", {
          params: { status: "active" },
        }),
      ]);
      setForms(Array.isArray(formsData) ? formsData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải dữ liệu.",
        variant: "destructive",
      });
      setForms([]);
      setDepartments([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm !== "") setIsSearching(true);
      fetchData();
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa biểu mẫu "${name}"?`)) return;
    try {
      await apiClient.delete(`/api/forms/${id}`);
      toast({
        title: "Đã xóa",
        description: `Biểu mẫu "${name}" đã được xóa.`,
      });
      fetchData();
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
            placeholder="Tìm kiếm biểu mẫu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-[12.5px] border-slate-200 focus:border-sky-300 focus:ring-sky-200"
          />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClass}
            disabled={!departments.length}
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="draft">Bản nháp</option>
            <option value="inactive">Không hoạt động</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
        <ViewToggleButton viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Content */}
      {forms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-[13px] text-slate-500">
            Không tìm thấy biểu mẫu nào
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <div className="grid grid-cols-[1fr_120px_140px_100px_80px_100px] gap-4 px-5 py-3 bg-slate-50/60">
            {[
              "Tên biểu mẫu",
              "Phòng ban",
              "Luồng phê duyệt",
              "Người tạo",
              "Lượt dùng",
              "",
            ].map((h) => (
              <span
                key={h}
                className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
              >
                {h}
              </span>
            ))}
          </div>
          {forms.map((form) => {
            const status =
              statusConfig[form.status as keyof typeof statusConfig];
            return (
              <div
                key={form._id}
                className="grid grid-cols-[1fr_120px_140px_100px_80px_100px] gap-4 items-center px-5 py-3.5 hover:bg-slate-50/50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 truncate">
                    {form.name}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border mt-0.5",
                      status?.className,
                    )}
                  >
                    {status?.label}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 truncate">
                  {departments.find((d) => d.name === form.category)?.name ||
                    "—"}
                </p>
                <p className="text-[12px] text-slate-500 truncate">
                  {(form.workflowId as Workflow)?.name || "—"}
                </p>
                <p className="text-[12px] text-slate-500 truncate">
                  {(form.createdBy as User)?.name || "—"}
                </p>
                <p className="text-[12px] text-slate-500">
                  {form.usageCount ?? 0}
                </p>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => router.push(`/forms/${form._id}`)}
                    className="h-7 w-7 rounded-lg hover:bg-sky-50 flex items-center justify-center text-slate-400 hover:text-sky-500 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => router.push(`/forms/${form._id}/edit`)}
                    className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(form._id, form.name)}
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
          {forms.map((form) => {
            const status =
              statusConfig[form.status as keyof typeof statusConfig];
            return (
              <div
                key={form._id}
                className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-slate-400" />
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
                <p className="text-[13px] font-semibold text-slate-800 mb-1 truncate">
                  {form.name}
                </p>
                {form.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                    {form.description}
                  </p>
                )}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11.5px]">
                    <span className="text-slate-400">Phòng ban</span>
                    <span className="text-slate-600 font-medium truncate max-w-[120px]">
                      {departments.find((d) => d.name === form.category)
                        ?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11.5px]">
                    <span className="text-slate-400">Lượt dùng</span>
                    <span className="text-slate-600 font-medium">
                      {form.usageCount ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-3 border-t border-slate-50">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/forms/${form._id}`)}
                    className="flex-1 h-7 text-[11.5px] text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg gap-1"
                  >
                    <Eye className="h-3 w-3" /> Xem
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/forms/${form._id}/edit`)}
                    className="flex-1 h-7 text-[11.5px] text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg gap-1"
                  >
                    <Edit className="h-3 w-3" /> Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(form._id, form.name)}
                    className="h-7 px-2 text-[11.5px] text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
