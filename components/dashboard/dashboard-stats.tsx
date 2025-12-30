"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckSquare, Clock } from "lucide-react"
import { LoadingCard } from "@/components/ui/loading"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface DashboardStatsData {
  totalUsers: number
  totalForms: number
  pendingApprovals: number
  totalSubmissions: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const [usersData, formsData, pendingSubmissionsData] = await Promise.all([
          apiClient.get("/api/users"),
          apiClient.get("/api/forms"),
          apiClient.get("/api/submissions", { params: { status: "pending" } }),
        ])

        setStats({
          totalUsers: usersData.length,
          totalForms: formsData.length,
          pendingApprovals: pendingSubmissionsData.length,
          totalSubmissions: formsData.reduce((sum: number, form: any) => sum + (form.usageCount || 0), 0),
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu thống kê tổng quan.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [toast])

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} className="h-28 sm:h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">
            Tổng số người dùng
          </CardTitle>
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-blue-800">{stats?.totalUsers}</div>
          <p className="text-xs text-blue-600">+20.1% từ tháng trước</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-700">
            Tổng số biểu mẫu
          </CardTitle>
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-green-800">{stats?.totalForms}</div>
          <p className="text-xs text-green-600">+180 từ tháng trước</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-yellow-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-yellow-700">
            Phê duyệt đang chờ
          </CardTitle>
          <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-yellow-800">{stats?.pendingApprovals}</div>
          <p className="text-xs text-yellow-600">+19% từ tháng trước</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">
            Tổng số lượt gửi
          </CardTitle>
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-purple-800">{stats?.totalSubmissions}</div>
          <p className="text-xs text-purple-600">+201 từ tháng trước</p>
        </CardContent>
      </Card>
    </div>
  )
}