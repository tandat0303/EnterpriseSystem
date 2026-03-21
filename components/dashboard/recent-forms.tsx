"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/ui/loading";
import type { FormTemplate } from "@/types";
import { apiClient } from "@/lib/api-client";

export function RecentForms() {
  const [recentForms, setRecentForms] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchRecentForms = async () => {
      setIsLoading(true);
      try {
        const data: FormTemplate[] = await apiClient.get("/api/forms");
        setRecentForms(
          data
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
          description: "Không thể tải danh sách biểu mẫu gần đây.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecentForms();
  }, [toast]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-sky-50 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-sky-500" />
          </div>
          <h3 className="text-[13px] font-semibold text-slate-800">
            Biểu mẫu gần đây
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/forms")}
          className="h-7 px-2.5 text-[12px] text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg"
        >
          Xem tất cả <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      {/* Body */}
      <div className="px-5 py-3">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} lines={2} className="h-10" />
            ))}
          </div>
        ) : recentForms.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {recentForms.map((form) => (
              <div
                key={form._id}
                className="flex items-center justify-between py-3 group cursor-pointer"
                onClick={() => router.push(`/forms/${form._id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-50 transition-colors duration-150">
                    <FileText className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-500 transition-colors duration-150" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate group-hover:text-sky-700 transition-colors duration-150">
                      {form.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {form.category}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-sky-400 transition-all duration-150 -translate-x-1 group-hover:translate-x-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
              <AlertCircle className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-[13px] text-slate-400">
              Không có biểu mẫu gần đây
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
