"use client";

import type React from "react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/components/ui/loading";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email không được để trống.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Email không hợp lệ.";
    if (!password) newErrors.password = "Mật khẩu không được để trống.";
    else if (password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const success = await login(email, password);
    if (success) router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #38bdf8 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <div>
              <p className="text-white font-semibold text-[15px] leading-none">
                Enterprise
              </p>
              <p className="text-slate-500 text-[10px] tracking-widest uppercase mt-0.5">
                System
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Quản lý biểu mẫu
              <br />& phê duyệt tập trung
            </h2>
            <p className="text-slate-400 text-[14px] leading-relaxed max-w-xs">
              Hệ thống quản lý toàn diện giúp tự động hóa quy trình phê duyệt
              nội bộ.
            </p>
          </div>
        </div>
        <div className="relative z-10 flex gap-6">
          {[
            ["1,284", "Người dùng"],
            ["342", "Biểu mẫu"],
            ["47", "Chờ duyệt"],
          ].map(([val, lbl]) => (
            <div key={lbl}>
              <p className="text-xl font-bold text-white">{val}</p>
              <p className="text-slate-500 text-xs mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-slate-800">
              Enterprise System
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Đăng nhập
            </h1>
            <p className="text-slate-500 text-[13px]">
              Nhập thông tin tài khoản của bạn để tiếp tục.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-slate-700"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ten@congty.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  disabled={isLoading}
                  className={`pl-9 h-10 text-[13px] border-slate-200 focus:border-sky-300 focus:ring-sky-200 ${errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-[11px]">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-[13px] font-medium text-slate-700"
              >
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: "" }));
                  }}
                  disabled={isLoading}
                  className={`pl-9 pr-10 h-10 text-[13px] border-slate-200 focus:border-sky-300 focus:ring-sky-200 ${errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-[11px]">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-medium mt-2 transition-all duration-150"
            >
              <ButtonLoading
                isLoading={isLoading}
                loadingText="Đang đăng nhập..."
              >
                Đăng nhập
              </ButtonLoading>
            </Button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-8">
            Enterprise System © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
