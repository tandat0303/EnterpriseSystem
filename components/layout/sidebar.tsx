"use client"

import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
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
  Menu
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { open, setOpen, isMobile } = useSidebar()

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
      title: "Lịch sử gửi của tôi",
      href: "/my-submissions",
      icon: FileText,
      permissions: ["form_submission_read_own"],
    },
    {
      title: "Biểu mẫu cần phê duyệt",
      href: "/approvals",
      icon: CheckSquare,
      permissions: ["form_submission_approve"],
    },
    {
      title: "Quản lý biểu mẫu",
      href: "/forms",
      icon: FileText,
      permissions: ["form_template_read", "form_template_create", "form_template_update", "form_template_delete"],
    },
    {
      title: "Quản lý người dùng",
      href: "/users",
      icon: Users,
      permissions: ["user_read", "user_create", "user_update", "user_delete"],
    },
    {
      title: "Quản lý vai trò",
      href: "/roles",
      icon: Shield,
      permissions: ["role_read", "role_create", "role_update", "role_delete"],
    },
    {
      title: "Quản lý phân quyền",
      href: "/permissions",
      icon: Lock,
      permissions: ["permission_read", "permission_create", "permission_update", "permission_delete"],
    },
    {
      title: "Quản lý phòng ban",
      href: "/departments",
      icon: Building,
      permissions: ["department_read", "department_create", "department_update", "department_delete"],
    },
    {
      title: "Quản lý luồng phê duyệt",
      href: "/workflows",
      icon: Workflow,
      permissions: ["workflow_read", "workflow_create", "workflow_update", "workflow_delete"],
    },
    {
      title: "Nhật ký hệ thống",
      href: "/audit-logs",
      icon: FileText,
      permissions: ["audit_log_read"],
    },
    {
      title: "Cài đặt",
      href: "/settings",
      icon: Settings,
      permissions: ["setting_read", "setting_update"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => {
    if (!user || !user.permissions) {
      return false
    }
    return item.permissions.some((permission) => user.permissions.includes(permission))
  })

  return (
    <Sidebar 
      collapsible="icon"
      className="bg-gradient-to-b from-blue-100 to-white border-r border-blue-200"
    >
      <SidebarHeader className="border-b border-blue-200">
        <div className={`flex items-center justify-center transition-all duration-300 ${open ? 'p-4' : 'p-2'}`}>
          {open ? (
            <img 
              src="/sgu-logo.png" 
              alt="SGU Logo" 
              className="h-12 sm:h-16 w-auto transition-all duration-300" 
            />
          ) : (
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="text-blue-700 text-xs font-semibold px-3 mb-2">
              Điều hướng
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <TooltipProvider delayDuration={0}>
                {filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          className={`
                            transition-all duration-200 rounded-lg
                            ${pathname === item.href 
                              ? "bg-blue-500 text-white hover:bg-blue-600" 
                              : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                            }
                            ${!open ? 'justify-center' : ''}
                          `}
                        >
                          <Link href={item.href} className="flex items-center gap-3 w-full">
                            <item.icon className={`${open ? 'h-5 w-5' : 'h-5 w-5'} flex-shrink-0`} />
                            {open && <span className="truncate">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent side="right" className="bg-gray-900 text-white">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-blue-200 p-2">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className={`
              w-full justify-center hover:bg-blue-100 text-blue-700 transition-all duration-200
              ${!open ? 'px-2' : 'px-4'}
            `}
          >
            {open ? (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Thu gọn</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="w-full justify-center hover:bg-blue-100 text-blue-700"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>

      <SidebarRail className="bg-blue-200" />
    </Sidebar>
  )
}