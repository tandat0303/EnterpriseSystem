"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  FileText,
  Users,
  Workflow,
  Settings,
  CheckSquare,
  Send,
  Shield,
  Building,
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { open, setOpen, isMobile } = useSidebar();

  const navItems = [
    {
      title: "Tổng quan",
      href: "/dashboard",
      icon: Home,
      permissions: ["dashboard_view"],
    },
    {
      title: "Gửi biểu mẫu",
      href: "/submit-form",
      icon: Send,
      permissions: ["form_submission_submit"],
    },
    {
      title: "Lịch sử của tôi",
      href: "/my-submissions",
      icon: FileText,
      permissions: ["form_submission_read_own"],
    },
    {
      title: "Phê duyệt",
      href: "/approvals",
      icon: CheckSquare,
      permissions: ["form_submission_approve"],
    },
    {
      title: "Biểu mẫu",
      href: "/forms",
      icon: FileText,
      permissions: [
        "form_template_read",
        "form_template_create",
        "form_template_update",
        "form_template_delete",
      ],
    },
    {
      title: "Người dùng",
      href: "/users",
      icon: Users,
      permissions: ["user_read", "user_create", "user_update", "user_delete"],
    },
    {
      title: "Vai trò",
      href: "/roles",
      icon: Shield,
      permissions: ["role_read", "role_create", "role_update", "role_delete"],
    },
    {
      title: "Phân quyền",
      href: "/permissions",
      icon: Lock,
      permissions: [
        "permission_read",
        "permission_create",
        "permission_update",
        "permission_delete",
      ],
    },
    {
      title: "Phòng ban",
      href: "/departments",
      icon: Building,
      permissions: [
        "department_read",
        "department_create",
        "department_update",
        "department_delete",
      ],
    },
    {
      title: "Luồng phê duyệt",
      href: "/workflows",
      icon: Workflow,
      permissions: [
        "workflow_read",
        "workflow_create",
        "workflow_update",
        "workflow_delete",
      ],
    },
    {
      title: "Nhật ký hệ thống",
      href: "/audit-logs",
      icon: ScrollText,
      permissions: ["audit_log_read"],
    },
    {
      title: "Cài đặt",
      href: "/settings",
      icon: Settings,
      permissions: ["setting_read", "setting_update"],
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!user?.permissions) return false;
    return item.permissions.some((p) => user.permissions.includes(p));
  });

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-[#0f172a]"
      style={{ "--sidebar-width": "220px" } as React.CSSProperties}
    >
      {/* Header */}
      <SidebarHeader className="border-b border-white/5 pb-0">
        <div
          className={cn(
            "flex items-center transition-all duration-300",
            open ? "px-5 py-4" : "px-2 py-4 justify-center",
          )}
        >
          {open ? (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                <img src="/sgu-logo.png" alt="SGU" className="h-5 w-auto" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white tracking-tight leading-none">
                  Enterprise
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 tracking-widest uppercase">
                  System
                </p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <img src="/sgu-logo.png" alt="SGU" className="h-5 w-auto" />
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="gap-0.5">
          {open && (
            <p className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase px-3 mb-2">
              Navigation
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <TooltipProvider delayDuration={0}>
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              "rounded-lg h-9 transition-all duration-150 group",
                              isActive
                                ? "bg-sky-500/15 text-sky-300"
                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                              !open && "justify-center px-2",
                            )}
                          >
                            <Link
                              href={item.href}
                              className="flex items-center gap-3 w-full"
                            >
                              <item.icon
                                className={cn(
                                  "h-4 w-4 flex-shrink-0 transition-colors",
                                  isActive
                                    ? "text-sky-400"
                                    : "text-slate-500 group-hover:text-slate-300",
                                )}
                              />
                              {open && (
                                <span className="text-[13px] font-medium truncate">
                                  {item.title}
                                </span>
                              )}
                              {open && isActive && (
                                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {!open && (
                          <TooltipContent
                            side="right"
                            className="bg-slate-800 text-slate-200 border-slate-700 text-xs"
                          >
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-white/5 p-2">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="w-full justify-center hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-all duration-200 h-8"
          >
            {open ? (
              <>
                <ChevronLeft className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Thu gọn</span>
              </>
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="w-full justify-center hover:bg-white/5 text-slate-500 hover:text-slate-300 h-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>

      <SidebarRail className="bg-transparent hover:bg-white/5" />
    </Sidebar>
  );
}
