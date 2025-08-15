"use client"

import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell, Mail, CheckCircle, XCircle, MessageSquare, FileText, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client" // Import apiClient
import type { Notification, User, FormSubmission } from "@/types"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get<{ notifications: Notification[]; unreadCount: number }>("/api/notifications", {
        params: { read: "false", limit: 5 },
      }) // Use apiClient.get

      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } else {
        console.error("API /api/notifications did not return expected data:", data)
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Có thể thêm polling hoặc WebSocket ở đây để cập nhật real-time
    const interval = setInterval(fetchNotifications, 60000) // Cập nhật mỗi 1 phút
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.post(`/api/notifications/${id}/read`, {}) // Use apiClient.post

      toast({
        title: "Thành công",
        description: "Thông báo đã được đánh dấu là đã đọc.",
      })
      fetchNotifications() // Tải lại danh sách thông báo
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
        return <FileText className="h-4 w-4 text-blue-500" />
      case "approval_required":
        return <CheckCircle className="h-4 w-4 text-yellow-500" />
      case "form_approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "form_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "feedback_received":
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      case "system_alert":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Mail className="h-4 w-4 text-gray-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          Thông báo ({unreadCount} chưa đọc)
          {isLoading && <LoadingSpinner size="sm" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Array.isArray(notifications) && notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start space-x-2 cursor-pointer ${
                !notification.read ? "bg-blue-50 font-medium" : ""
              }`}
            >
              <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
              <div className="flex-grow">
                <p className="text-sm leading-tight">{notification.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(notification.userId as User)?.name || "Hệ thống"} -{" "}
                  {new Date(notification.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem className="text-center text-gray-500" disabled>
            Không có thông báo mới
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/notifications")} className="justify-center">
          Xem tất cả thông báo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
