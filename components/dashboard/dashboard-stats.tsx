"use client";

import { useState, useEffect } from "react";
import { Users, FileText, CheckSquare, TrendingUp } from "lucide-react";
import { LoadingCard } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface DashboardStatsData {
  totalUsers: number;
  totalForms: number;
  pendingApprovals: number;
  totalSubmissions: number;
}

const statCards = [
  {
    key: "totalUsers" as const,
    label: "Người dùng",
    icon: Users,
    color: "sky",
    change: "+20.1%",
    note: "từ tháng trước",
  },
  {
    key: "totalForms" as const,
    label: "Biểu mẫu",
    icon: FileText,
    color: "emerald",
    change: "+180",
    note: "từ tháng trước",
  },
  {
    key: "pendingApprovals" as const,
    label: "Chờ phê duyệt",
    icon: CheckSquare,
    color: "amber",
    change: "+19%",
    note: "từ tháng trước",
  },
  {
    key: "totalSubmissions" as const,
    label: "Lượt gửi",
    icon: TrendingUp,
    color: "violet",
    change: "+201",
    note: "từ tháng trước",
  },
];

const colorMap = {
  sky: {
    icon: "text-sky-500 bg-sky-50",
    value: "text-sky-700",
    badge: "text-sky-600 bg-sky-50",
    border: "border-sky-100",
    glow: "shadow-sky-100",
  },
  emerald: {
    icon: "text-emerald-500 bg-emerald-50",
    value: "text-emerald-700",
    badge: "text-emerald-600 bg-emerald-50",
    border: "border-emerald-100",
    glow: "shadow-emerald-100",
  },
  amber: {
    icon: "text-amber-500 bg-amber-50",
    value: "text-amber-700",
    badge: "text-amber-600 bg-amber-50",
    border: "border-amber-100",
    glow: "shadow-amber-100",
  },
  violet: {
    icon: "text-violet-500 bg-violet-50",
    value: "text-violet-700",
    badge: "text-violet-600 bg-violet-50",
    border: "border-violet-100",
    glow: "shadow-violet-100",
  },
};

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [usersData, formsData, pendingSubmissionsData] =
          await Promise.all([
            apiClient.get("/api/users"),
            apiClient.get("/api/forms"),
            apiClient.get("/api/submissions", {
              params: { status: "pending" },
            }),
          ]);
        setStats({
          totalUsers: usersData.length,
          totalForms: formsData.length,
          pendingApprovals: pendingSubmissionsData.length,
          totalSubmissions: formsData.reduce(
            (sum: number, form: any) => sum + (form.usageCount || 0),
            0,
          ),
        });
      } catch {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu thống kê.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => {
        const colors = colorMap[card.color];
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={cn(
              "bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 group cursor-default",
              colors.border,
              colors.glow,
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center",
                  colors.icon,
                )}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full",
                  colors.badge,
                )}
              >
                {card.change}
              </span>
            </div>
            <div
              className={cn(
                "text-2xl font-bold tracking-tight mb-1",
                colors.value,
              )}
            >
              {(stats?.[card.key] ?? 0).toLocaleString()}
            </div>
            <p className="text-[12px] text-slate-500 font-medium">
              {card.label}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{card.note}</p>
          </div>
        );
      })}
    </div>
  );
}
