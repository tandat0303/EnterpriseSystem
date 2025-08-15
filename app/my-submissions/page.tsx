"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Eye } from "lucide-react"
import { format } from "date-fns"

import type { FormSubmission, FormTemplate } from "@/types"

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()

  useEffect(() => {
    const fetchMySubmissions = async () => {
      if (!user?._id) {
        if (!isAuthLoading) {
          toast({
            title: "Lỗi truy cập",
            description: "Bạn cần đăng nhập để xem lịch sử gửi biểu mẫu.",
            variant: "destructive",
          })
          router.push("/auth/login")
        }
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/submissions?submitterId=${user._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch my submissions")
        }
        const data: FormSubmission[] = await response.json()
        setSubmissions(data)
      } catch (error) {
        console.error("Error fetching my submissions:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải lịch sử gửi biểu mẫu của bạn.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (!isAuthLoading) {
      fetchMySubmissions()
    }
  }, [user, isAuthLoading])

  const handleViewSubmission = (id: string) => {
    router.push(`/my-submissions/${id}`)
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    feedback_requested: "bg-blue-100 text-blue-800",
  }

  const statusLabels = {
    pending: "Đang chờ",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
    feedback_requested: "Yêu cầu phản hồi",
  }

  if (isLoading || isAuthLoading) {
    return <div className="text-center py-8">Đang tải lịch sử biểu mẫu...</div>
  }

  if (!user) {
    return <div className="text-center py-8 text-gray-500">Bạn cần đăng nhập để xem lịch sử gửi biểu mẫu.</div>
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Lịch sử biểu mẫu đã gửi</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p className="text-lg">Bạn chưa gửi biểu mẫu nào.</p>
            <p className="text-sm mt-2">Hãy bắt đầu bằng cách gửi một biểu mẫu mới!</p>
            <Button onClick={() => router.push("/submit-form")} className="mt-4">
              Gửi biểu mẫu mới
            </Button>
          </div>
        ) : (
          submissions.map((submission) => (
            <Card key={submission._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {(submission.formTemplateId as FormTemplate)?.name || "Biểu mẫu không tên"}
                  </CardTitle>
                  <Badge className={statusColors[submission.status as keyof typeof statusColors]}>
                    {statusLabels[submission.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Gửi ngày: {format(new Date(submission.createdAt), "PPP")}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Trạng thái hiện tại:</span>
                  <span className="font-medium">{statusLabels[submission.status as keyof typeof statusLabels]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ưu tiên:</span>
                  <span className="font-medium">{submission.priority}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => handleViewSubmission(submission._id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}
