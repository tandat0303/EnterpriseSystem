"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LoadingSkeleton } from "@/components/ui/loading"
import type { FormSubmission } from "@/types"
import { useAuth } from "@/components/providers/auth-provider"
import { apiClient } from "@/lib/api-client"

export function PendingApprovals() {
  const { user } = useAuth()
  const [pendingApprovals, setPendingApprovals] = useState<FormSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await apiClient.get<FormSubmission[]>("/api/submissions", {
          params: {
            currentUserRoleId: user.roleId ? user.roleId.toString() : "",
            currentUserDepartment: user.departmentId ? user.departmentId.toString() : "",
            currentUserId: user._id.toString(),
          },
        })

        const sortedApprovals = response
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
        setPendingApprovals(sortedApprovals)
      } catch (error) {
        console.error("Error fetching pending approvals:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách phê duyệt đang chờ.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchPendingApprovals()
  }, [toast, user])

  const handleViewApproval = (id: string) => {
    router.push(`/approvals/${id}`)
  }

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-gray-800">Phê duyệt đang chờ</CardTitle>
        <Clock className="h-5 w-5 text-yellow-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} lines={2} className="h-12" />
            ))}
          </div>
        ) : pendingApprovals.length > 0 ? (
          <div className="space-y-4">
            {pendingApprovals.map((  approval) => (
              <div
                key={approval._id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-yellow-50 transition-colors duration-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {(approval.formTemplateId as any)?.name || "Biểu mẫu không tên"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Người gửi: {(approval.submitterId as any)?.name || "N/A"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewApproval(approval._id)}
                  className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                >
                  Xem <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Không có phê duyệt nào đang chờ.</p>
        )}
      </CardContent>
    </Card>
  )
}