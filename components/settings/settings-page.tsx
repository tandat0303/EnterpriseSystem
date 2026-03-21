"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ButtonLoading, LoadingCard } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import { Save, Settings } from "lucide-react";
import type { Setting, User } from "@/types";

export function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const data: Setting[] = await apiClient.get("/api/settings");
        setSettings(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải cài đặt.",
          variant: "destructive",
        });
        setSettings([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = e.target as HTMLFormElement;
      const updatedSettings = settings.map((setting) => {
        const el = form.elements.namedItem(setting.key) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null;
        let value: any = setting.value;
        if (el) {
          if (setting.type === "boolean")
            value = (el as HTMLInputElement).checked;
          else if (setting.type === "number") value = parseFloat(el.value);
          else if (setting.type === "array" || setting.type === "object") {
            try {
              value = JSON.parse(el.value);
            } catch {
              throw new Error(
                `JSON không hợp lệ cho '${setting.displayName || setting.key}'`,
              );
            }
          } else value = el.value;
        }
        return {
          key: setting.key,
          value,
          type: setting.type,
          description: setting.description,
          category: setting.category,
          isPublic: setting.isPublic,
        };
      });

      for (const s of updatedSettings) await apiClient.put("/api/settings", s);
      toast({ title: "Thành công", description: "Cài đặt đã được cập nhật!" });
      const data: Setting[] = await apiClient.get("/api/settings");
      if (Array.isArray(data)) setSettings(data);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingCard key={i} className="h-48" />
        ))}
      </div>
    );
  }

  const grouped = settings.reduce(
    (acc, s) => {
      const cat = s.category || "Khác";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, Setting[]>,
  );

  const inputClass =
    "h-9 text-[13px] border-slate-200 focus:border-sky-300 focus:ring-1 focus:ring-sky-200";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Settings className="h-4.5 w-4.5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cài đặt hệ thống</h1>
          <p className="text-[13px] text-slate-500">
            Quản lý cấu hình và tuỳ chọn hệ thống
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        {Object.entries(grouped).map(([category, categorySettings]) => (
          <div
            key={category}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
          >
            {/* Category header */}
            <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
              <h2 className="text-[13px] font-semibold text-slate-700 capitalize">
                {category.replace(/_/g, " ")}
              </h2>
            </div>
            {/* Settings */}
            <div className="divide-y divide-slate-50">
              {categorySettings.map((setting) => (
                <div key={setting.key} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor={setting.key}
                        className="text-[13px] font-medium text-slate-800"
                      >
                        {setting.displayName || setting.key}
                      </Label>
                      {setting.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    {/* Control */}
                    <div className="flex-shrink-0 w-64">
                      {setting.type === "boolean" ? (
                        <Switch
                          id={setting.key}
                          name={setting.key}
                          defaultChecked={setting.value}
                          disabled={isSaving}
                        />
                      ) : setting.type === "string" ? (
                        <Input
                          id={setting.key}
                          name={setting.key}
                          defaultValue={setting.value}
                          disabled={isSaving}
                          className={inputClass}
                        />
                      ) : setting.type === "number" ? (
                        <Input
                          id={setting.key}
                          name={setting.key}
                          type="number"
                          defaultValue={setting.value}
                          disabled={isSaving}
                          className={inputClass}
                        />
                      ) : (
                        <Textarea
                          id={setting.key}
                          name={setting.key}
                          defaultValue={JSON.stringify(setting.value, null, 2)}
                          disabled={isSaving}
                          rows={4}
                          className="text-[12px] font-mono border-slate-200 focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-2">
                    Cập nhật bởi{" "}
                    {(setting.updatedBy as User)?.name || "Hệ thống"} ·{" "}
                    {new Date(setting.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button
          type="submit"
          disabled={isSaving}
          className="h-9 px-5 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg gap-2"
        >
          <Save className="h-3.5 w-3.5" />
          <ButtonLoading isLoading={isSaving} loadingText="Đang lưu...">
            Lưu cài đặt
          </ButtonLoading>
        </Button>
      </form>
    </div>
  );
}
