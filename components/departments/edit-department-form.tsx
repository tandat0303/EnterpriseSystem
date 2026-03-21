"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ButtonLoading, LoadingCard } from "@/components/ui/loading";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { Department, User } from "@/types";

const inputClass =
  "h-9 text-[13px] border-slate-200 focus:border-sky-300 focus:ring-1 focus:ring-sky-200";
const selectClass =
  "w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 appearance-none disabled:opacity-50";

export function EditDepartmentForm({ departmentId }: { departmentId: string }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
    code: "",
    status: "active",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const dept = await apiClient.get<Department>(
          `/api/departments/${departmentId}`,
        );
        setFormData({
          name: dept.name || "",
          description: dept.description || "",
          managerId: (dept.managerId as any)?._id || dept.managerId || "",
          code: dept.code || "",
          status: dept.status || "active",
        });
        setIsLoadingUsers(true);
        const usersData = await apiClient.get<User[]>("/api/users", {
          params: { departmentId },
        });
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin.",
          variant: "destructive",
        });
        router.push("/departments");
      } finally {
        setIsLoading(false);
        setIsLoadingUsers(false);
      }
    };
    load();
  }, [departmentId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name || formData.name.trim().length < 2)
      e.name = "Tên phòng ban phải có ít nhất 2 ký tự.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
    setErrors((p) => ({ ...p, [id]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      await apiClient.put(`/api/departments/${departmentId}`, {
        ...formData,
        managerId: formData.managerId || undefined,
        code: formData.code || undefined,
      });
      toast({
        title: "Thành công",
        description: "Phòng ban đã được cập nhật!",
      });
      router.push("/departments");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="max-w-xl space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/departments")}
          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Chỉnh sửa phòng ban
          </h1>
          <p className="text-[12px] text-slate-400">{formData.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/40">
          <h2 className="text-[13px] font-semibold text-slate-700">
            Thông tin phòng ban
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-[12.5px] font-medium text-slate-600"
            >
              Tên phòng ban <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSaving}
              className={inputClass}
            />
            {errors.name && (
              <p className="text-red-500 text-[11px]">{errors.name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="code"
              className="text-[12.5px] font-medium text-slate-600"
            >
              Mã phòng ban
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={handleChange}
              disabled={isSaving}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-[12.5px] font-medium text-slate-600"
            >
              Mô tả
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isSaving}
              rows={3}
              className="text-[13px] border-slate-200 focus:border-sky-300 focus:ring-sky-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="managerId"
              className="text-[12.5px] font-medium text-slate-600"
            >
              Trưởng phòng
            </Label>
            <div className="relative">
              <select
                id="managerId"
                value={formData.managerId}
                onChange={handleChange}
                className={selectClass}
                disabled={isSaving || isLoadingUsers}
              >
                <option value="">
                  {isLoadingUsers
                    ? "Đang tải..."
                    : users.length
                      ? "Chọn trưởng phòng"
                      : "Không có người dùng"}
                </option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="status"
              className="text-[12.5px] font-medium text-slate-600"
            >
              Trạng thái
            </Label>
            <div className="relative">
              <select
                id="status"
                value={formData.status}
                onChange={handleChange}
                className={selectClass}
                disabled={isSaving}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="h-9 px-5 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium rounded-lg"
            >
              <ButtonLoading isLoading={isSaving} loadingText="Đang lưu...">
                Cập nhật phòng ban
              </ButtonLoading>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
