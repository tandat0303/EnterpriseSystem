"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { LoadingCard } from "../ui/loading"
import { FormRenderer } from "@/components/forms/form-renderer"
import { SubmissionActionButtons } from "@/components/submissions/submission-action-buttons"
import { useAuth } from "@/components/providers/auth-provider"
import { apiClient } from "@/lib/api-client"
import type { FormSubmission, FormTemplate, Workflow, User } from "@/types"

interface SubmissionDetailViewProps {
  submissionId: string
}

export function SubmissionDetailView({ submissionId }: SubmissionDetailViewProps) {
  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchSubmission = async () => {
    setIsLoading(true)
    try {
      const data: FormSubmission = await apiClient.get(`/api/submissions/${submissionId}`)
      setSubmission(data)
    } catch (error: any) {
      console.error("Error fetching submission:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải chi tiết biểu mẫu đã gửi.",
        variant: "destructive",
      })
      router.push("/my-submissions")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (submissionId) {
      fetchSubmission()
    }
  }, [submissionId])

  const handleActionSuccess = () => {
    toast({
      title: "Thành công",
      description: "Hành động phê duyệt đã được thực hiện.",
    })
    fetchSubmission()
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <LoadingCard className="h-[600px] bg-gradient-to-br from-gray-50 to-white">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
          </div>
        </LoadingCard>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <div className="text-center py-12 text-gray-500">Không tìm thấy biểu mẫu đã gửi.</div>
      </div>
    )
  }

  const formTemplate = submission.formTemplateId as FormTemplate
  const submitter = submission.submitterId as User
  const workflow = (formTemplate?.workflowId || null) as Workflow | null

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    approved: "bg-green-100 text-green-800 hover:bg-green-200",
    rejected: "bg-red-100 text-red-800 hover:bg-red-200",
    feedback_requested: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  }

  const statusLabels = {
    pending: "Đang chờ",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
    feedback_requested: "Yêu cầu phản hồi",
  }

  const currentWorkflowStep = workflow?.steps[submission.currentStep]
  const isCurrentUserApprover =
    user &&
    currentWorkflowStep &&
    submission.status !== "approved" &&
    submission.status !== "rejected" &&
    user.role === currentWorkflowStep.role &&
    (!currentWorkflowStep.approverIds ||
      currentWorkflowStep.approverIds.length === 0 ||
      currentWorkflowStep.approverIds.includes(user._id))

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold text-blue-800">Chi tiết biểu mẫu đã gửi</CardTitle>
          <Badge
            className={`${statusColors[submission.status as keyof typeof statusColors]} transition-colors duration-200`}
          >
            {statusLabels[submission.status as keyof typeof statusLabels]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tên biểu mẫu:</p>
              <p className="font-medium text-gray-800">{formTemplate?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Người gửi:</p>
              <p className="font-medium text-gray-800">
                {submitter?.name || "N/A"} ({submitter?.email || "N/A"})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngày gửi:</p>
              <p className="font-medium text-gray-800">{format(new Date(submission.createdAt), "PPP p")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ưu tiên:</p>
              <p className="font-medium text-gray-800">{submission.priority}</p>
            </div>
          </div>

          <Separator />

          <h3 className="text-lg font-semibold text-blue-800 mb-2">Dữ liệu biểu mẫu</h3>
          {formTemplate?.fields && (
            <FormRenderer fields={formTemplate.fields} initialData={submission.data} readOnly={true} />
          )}

          <Separator />

          <h3 className="text-lg font-semibold text-blue-800 mb-2">Luồng phê duyệt</h3>
          {workflow ? (
            <ol className="relative border-l border-blue-200 ml-4">
              {workflow.steps.map((step, index) => (
                <li key={step.id} className="mb-4 ml-6">
                  <span
                    className={cn(
                      "absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white",
                      index < submission.currentStep || submission.status === "approved"
                        ? "bg-green-200 text-green-800"
                        : index === submission.currentStep && submission.status === "pending"
                          ? "bg-yellow-200 text-yellow-800"
                          : index === submission.currentStep && submission.status === "feedback_requested"
                            ? "bg-blue-200 text-blue-800"
                            : "bg-gray-200 text-gray-800",
                    )}
                  >
                    {index + 1}
                  </span>
                  <h4 className="flex items-center mb-1 text-md font-semibold text-blue-700">
                    Bước {index + 1}: {step.role}
                    {index === submission.currentStep && submission.status === "pending" && (
                      <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                        Đang chờ
                      </Badge>
                    )}
                    {index === submission.currentStep && submission.status === "feedback_requested" && (
                      <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                        Yêu cầu phản hồi
                      </Badge>
                    )}
                    {index < submission.currentStep && (
                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                        Đã hoàn thành
                      </Badge>
                    )}
                    {submission.status === "rejected" && index === submission.currentStep && (
                      <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-200">
                        Đã từ chối
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {step.required ? "Bắt buộc" : "Tùy chọn"}
                    {step.approverIds &&
                      step.approverIds.length > 0 &&
                      ` - Người phê duyệt cụ thể: ${step.approverIds.join(", ")}`}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-500">Không có luồng phê duyệt được liên kết.</p>
          )}

          <Separator />

          <h3 className="text-lg font-semibold text-blue-800 mb-2">Lịch sử phê duyệt</h3>
          {submission.approvalHistory && submission.approvalHistory.length > 0 ? (
            <div className="space-y-3">
              {submission.approvalHistory.map((action, index) => (
                <Card
                  key={index}
                  className="p-3 bg-white hover:bg-blue-50 transition-colors duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <p className="text-sm font-medium text-gray-800">
                    {(action.approverId as User)?.name || "N/A"} đã{" "}
                    <span
                      className={cn(
                        action.action === "approve" && "text-green-600",
                        action.action === "reject" && "text-red-600",
                        action.action === "feedback" && "text-blue-600",
                        action.action === "submitted" && "text-purple-600",
                      )}
                    >
                      {action.action === "approve" && "duyệt"}
                      {action.action === "reject" && "từ chối"}
                      {action.action === "feedback" && "yêu cầu phản hồi"}
                      {action.action === "submitted" && "gửi"}
                    </span>{" "}
                    vào lúc {format(new Date(action.timestamp), "PPP p")}
                  </p>
                  {action.comment && <p className="text-sm text-gray-600 mt-1">Bình luận: "{action.comment}"</p>}
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chưa có lịch sử phê duyệt.</p>
          )}

          {isCurrentUserApprover && (
            <div className="mt-6">
              <SubmissionActionButtons submissionId={submissionId} onActionSuccess={handleActionSuccess} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}