"use client"
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
} from "@/components/ui/sidebar"
import { Home, FileText, Users, Workflow, Settings, CheckSquare, Send, Shield, Building, Lock } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

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
    <Sidebar className="bg-gradient-to-b from-blue-100 to-white">
      <SidebarHeader>
        <div className="flex items-center justify-center p-4">
          <img src="/sgu-logo.png" alt="SGU Logo" className="h-16 w-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700">Điều hướng</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={`hover:bg-blue-50 hover:text-blue-800 transition-colors duration-200 ${
                      pathname === item.href ? "bg-blue-100 text-blue-900" : "text-gray-800"
                    }`}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail className="bg-blue-100" />
    </Sidebar>
  )
}