"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingCard } from "@/components/ui/loading"
import { Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { AuditLog, User } from "@/types"
import { ViewToggleButton } from "@/components/ui/view-toggle-button"

const resourceTypeLabels: Record<string, string> = {
  FormTemplate: "Biểu mẫu",
  FormSubmission: "Đơn gửi",
  User: "Người dùng",
  Workflow: "Luồng phê duyệt",
  Department: "Phòng ban",
  Setting: "Cài đặt",
  Role: "Vai trò",
  Permission: "Quyền hạn",
  System: "Hệ thống",
}

const actionLabels: Record<string, string> = {
  create: "Tạo mới",
  update: "Cập nhật",
  delete: "Xóa",
  approve: "Phê duyệt",
  reject: "Từ chối",
  submit: "Gửi",
  login: "Đăng nhập",
  logout: "Đăng xuất",
}

const actionColors: Record<string, string> = {
  create: "bg-blue-100 text-blue-800",
  update: "bg-yellow-100 text-yellow-800",
  delete: "bg-red-100 text-red-800",
  approve: "bg-green-100 text-green-800",
  reject: "bg-orange-100 text-orange-800",
  submit: "bg-purple-100 text-purple-800",
  login: "bg-indigo-100 text-indigo-800",
  logout: "bg-gray-100 text-gray-800",
}

export function AuditLogsList() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterUserId, setFilterUserId] = useState("all")
  const [filterResourceType, setFilterResourceType] = useState("all")
  const [filterAction, setFilterAction] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { toast } = useToast()

  const fetchAuditLogs = async () => {
    setIsLoading(true)
    try {
      const queryParams: Record<string, string> = {}
      if (filterUserId !== "all") queryParams.userId = filterUserId
      if (filterResourceType !== "all") queryParams.resourceType = filterResourceType
      if (filterAction !== "all") queryParams.action = filterAction

      const data: AuditLog[] = await apiClient.get("/api/audit-logs", { params: queryParams })
      if (Array.isArray(data)) {
        setAuditLogs(data)
      } else {
        console.error("API /api/audit-logs did not return an array:", data)
        setAuditLogs([])
        toast({
          title: "Lỗi dữ liệu",
          description: "Dữ liệu nhật ký kiểm toán không hợp lệ.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error)
      setAuditLogs([])
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải nhật ký kiểm toán.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data: User[] = await apiClient.get("/api/users")
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.error("API /api/users did not return an array:", data)
        setUsers([])
      }
    } catch (error: any) {
      console.error("Failed to fetch users for filter:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchAuditLogs()
  }, [filterUserId, filterResourceType, filterAction])

  if (isLoading) {
    return (
      <div className="space-y-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingCard key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-blue-800">Nhật ký hệ thống</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
        >
          <option value="all">Tất cả người dùng</option>
          {Array.isArray(users) &&
            users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
        </select>
        <select
          value={filterResourceType}
          onChange={(e) => setFilterResourceType(e.target.value)}
          className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
        >
          <option value="all">Tất cả tài nguyên</option>
          {Object.keys(resourceTypeLabels).map((key) => (
            <option key={key} value={key}>
              {resourceTypeLabels[key]}
            </option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
        >
          <option value="all">Tất cả hành động</option>
          {Object.keys(actionLabels).map((key) => (
            <option key={key} value={key}>
              {actionLabels[key]}
            </option>
          ))}
        </select>
        <ViewToggleButton viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}`}>
        {Array.isArray(auditLogs) && auditLogs.length > 0 ? (
          auditLogs.map((log) => (
            <Card
              key={log._id}
              className={`bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300 ${
                viewMode === "list" ? "w-full py-2 px-3" : ""
              }`}
            >
              <CardContent className={`${viewMode === "list" ? "p-2" : "p-4"} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={`${actionColors[log.action]} ${
                        viewMode === "list" ? "text-xs py-0.5 px-1" : ""
                      } hover:bg-opacity-80 transition-colors duration-200`}
                    >
                      {actionLabels[log.action]}
                    </Badge>
                    <span className={`font-medium text-gray-700 ${viewMode === "list" ? "text-sm" : "text-sm"}`}>
                      {resourceTypeLabels[log.resourceType] || log.resourceType}
                    </span>
                  </div>
                  <span className={`text-gray-500 ${viewMode === "list" ? "text-xs" : "text-xs"}`}>
                    <Clock className="inline-block h-3 w-3 mr-1" />
                    {new Date(log.createdAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                </div>
                {viewMode === "grid" && <p className="text-gray-800">{log.description}</p>}
                <div className={`text-gray-600 ${viewMode === "list" ? "text-xs" : "text-sm"}`}>
                  Người dùng:{" "}
                  <span className="font-medium">
                    {(log.userId as User)?.name || (log.userId === "system" ? "Hệ thống" : "Ẩn danh")}
                  </span>
                  {log.ipAddress && viewMode === "grid" && <span className="ml-4">IP: {log.ipAddress}</span>}
                </div>
                {log.resourceId && viewMode === "grid" && (
                  <div className="text-xs text-gray-500">ID tài nguyên: {log.resourceId}</div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-gray-600">Không tìm thấy nhật ký kiểm toán nào.</div>
        )}
      </div>
    </div>
  )
}