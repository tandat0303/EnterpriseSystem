"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User, Search, Menu, X } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { SearchForm } from "@/components/layout/search-form";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { toggleSidebar, isMobile } = useSidebar();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/90 backdrop-blur-md px-4 md:px-6">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[13px] font-medium text-slate-500 hidden sm:block">
            Xin chào,{" "}
            <span className="text-slate-800 font-semibold">
              {user?.name?.split(" ").pop() || "bạn"}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={cn(
              "h-8 w-8 rounded-lg transition-all duration-150",
              isSearchOpen
                ? "bg-slate-100 text-slate-700"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
            )}
          >
            {isSearchOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          {isSearchOpen && (
            <div className="absolute top-10 right-0 z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-150">
              <SearchForm className="bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden" />
            </div>
          )}
        </div>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 gap-2 px-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-sky-400 to-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium hidden sm:block max-w-[100px] truncate">
                {user?.name || "Người dùng"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white border-slate-200 shadow-lg rounded-xl p-1"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-[13px] font-semibold text-slate-800 truncate">
                {user?.name || "Người dùng"}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {user?.email || "N/A"}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 my-1" />
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-[13px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer rounded-lg px-3 py-2"
            >
              <Settings className="mr-2 h-3.5 w-3.5" />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/users/${user?._id}`)}
              className="text-[13px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer rounded-lg px-3 py-2"
            >
              <User className="mr-2 h-3.5 w-3.5" />
              Hồ sơ
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[13px] text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer rounded-lg px-3 py-2"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
