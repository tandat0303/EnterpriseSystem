"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingCard } from "@/components/ui/loading"
import { Mail, CheckCircle, XCircle, MessageSquare, FileText, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Notification, User, FormSubmission } from "@/types"
import { ViewToggleButton } from "@/components/ui/view-toggle-button"

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all") // "all", "read", "unread"
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const router = useRouter()
  const { toast } = useToast()

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const queryParams: Record<string, string> = {}
      if (filter === "read") queryParams.read = "true"
      if (filter === "unread") queryParams.read = "false"

      const data = await apiClient.get<{ notifications: Notification[]; unreadCount: number }>("/api/notifications", {
        params: queryParams,
      })

      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } else {
        console.error("API /api/notifications did not return expected data:", data)
        setNotifications([])
        setUnreadCount(0)
        toast({
          title: "Lỗi dữ liệu",
          description: "Dữ liệu thông báo không hợp lệ.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error)
      setNotifications([])
      setUnreadCount(0)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách thông báo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.post(`/api/notifications/${id}/read`, {})
      toast({
        title: "Thành công",
        description: "Thông báo đã được đánh dấu là đã đọc.",
      })
      fetchNotifications()
    } catch (error: any) {
      console.error("Mark as read failed:", error)
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "form_submitted":
        return <FileText className={`text-blue-500 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"}`} />
      case "approval_required":
        return <CheckCircle className={`text-yellow-500 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"}`} />
      case "form_approved":
        return <CheckCircle className={`text-green-500 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"}`} />
      case "form_rejected":
        return <XCircle className={`text-red-500 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"}`} />
      case "feedback_received":
        return <MessageSquare className={`text-purple-500 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"}`} />
      case "system_alert":
        return <AlertCircle className={`text-red-500 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"}`} />
      default:
        return <Mail className={`text-gray-500 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"}`} />
    }
  }

  const getStatusBadge = (read: boolean) => {
    return read ? (
      <Badge variant="outline" className={`bg-gray-100 text-gray-600 ${viewMode === "list" ? "text-xs py-0.5 px-1" : ""}`}>
        Đã đọc
      </Badge>
    ) : (
      <Badge variant="default" className={`bg-blue-500 text-white ${viewMode === "list" ? "text-xs py-0.5 px-1" : ""}`}>
        Mới
      </Badge>
    )
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="flex gap-4">
            <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingCard key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Thông báo của bạn ({unreadCount} chưa đọc)</h1>
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
          >
            <option value="all">Tất cả</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>
          <ViewToggleButton viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}`}>
        {Array.isArray(notifications) && notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                viewMode === "list" ? "w-full py-2 px-3" : ""
              } ${!notification.read ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className={`flex items-start space-x-4 ${viewMode === "list" ? "p-2" : "p-4"}`}>
                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <CardTitle className={`${viewMode === "list" ? "text-sm" : "text-lg"} font-semibold`}>
                      {notification.title}
                    </CardTitle>
                    {getStatusBadge(notification.read)}
                  </div>
                  {viewMode === "grid" && <p className="text-sm text-gray-700 mt-1">{notification.message}</p>}
                  <p className={`text-gray-500 mt-2 ${viewMode === "list" ? "text-xs" : "text-xs"}`}>
                    {(notification.userId as User)?.name || "Người dùng không xác định"} -{" "}
                    {new Date(notification.createdAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkAsRead(notification._id)
                    }}
                    className={`${viewMode === "list" ? "p-1 h-8 w-8" : "flex-shrink-0"}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {viewMode === "grid" && <span className="ml-1">Đánh dấu đã đọc</span>}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">Không có thông báo nào.</div>
        )}
      </div>
    </div>
  )
}