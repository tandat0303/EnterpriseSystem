"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, X, MessageSquare, FileText, Clock, Download, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/providers/auth-provider"
import { apiClient } from "@/lib/api-client"
import type { FormSubmission, FormField, User as UserType, FormTemplate, WorkflowInstanceStep } from "@/types"
import { LoadingCard, LoadingSkeleton, ButtonLoading } from "@/components/ui/loading"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalDetailProps {
  approvalId: string
}

export function ApprovalDetail({ approvalId }: ApprovalDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isFeedbacking, setIsFeedbacking] = useState(false)

  const fetchSubmission = async () => {
    setIsLoading(true)
    try {
      const data: FormSubmission = await apiClient.get(`/api/submissions/${approvalId}`)
      console.log("Fetched submission data:", data)
      setSubmission(data)
    } catch (error: any) {
      console.error("Error fetching submission:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin yêu cầu phê duyệt.",
        variant: "destructive",
      })
      router.push("/approvals")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmission()
  }, [approvalId])

  const handleAction = async (action: "approve" | "reject" | "feedback") => {
    if (!user || !submission) return

    if (action === "approve") setIsApproving(true)
    if (action === "reject") setIsRejecting(true)
    if (action === "feedback") setIsFeedbacking(true)

    try {
      console.log("Sending POST request:", { url: `/api/submissions/${submission._id}/action`, data: { action, comment, approverId: user._id } })
      const response = await apiClient.post(`/api/submissions/${submission._id}/action`, {
        action,
        comment: action === "feedback" && !comment ? "Phản hồi không có nội dung" : comment,
        approverId: user._id,
      })

      setSubmission(response)

      toast({
        title: "Thành công",
        description: `Yêu cầu đã được ${action === "approve" ? "duyệt" : action === "reject" ? "từ chối" : "gửi phản hồi"} thành công.`,
      })
      setComment("")

      router.refresh()
    } catch (error: any) {
      console.error(`Failed to ${action} approval:`, error)
      toast({
        title: "Lỗi",
        description: error.message || `Có lỗi xảy ra khi ${action === "approve" ? "duyệt" : action === "reject" ? "từ chối" : "gửi phản hồi"} yêu cầu.`,
        variant: "destructive",
      })
    } finally {
      if (action === "approve") setIsApproving(false)
      if (action === "reject") setIsRejecting(false)
      if (action === "feedback") setIsFeedbacking(false)
    }
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    feedback_requested: "bg-blue-100 text-blue-800",
  }

  const statusLabels = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    feedback_requested: "Yêu cầu phản hồi",
  }

  const priorityColors = {
    high: "text-red-600",
    medium: "text-yellow-600",
    low: "text-green-600",
  }

  const actionLabels = {
    approve: "Duyệt",
    reject: "Từ chối",
    feedback: "Phản hồi",
    submitted: "Gửi",
  }

  if (isLoading) {
    return (
      <div className="space-y-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            <div>
              <LoadingSkeleton className="h-8 w-64" />
              <LoadingSkeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LoadingCard className="h-48" />
            <LoadingCard className="h-64" />
          </div>
          <div className="space-y-6">
            <LoadingCard className="h-48" />
            <LoadingCard className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!submission || !submission.formTemplateId || !submission.submitterId) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
        Dữ liệu biểu mẫu không đầy đủ hoặc không tìm thấy.
      </div>
    )
  }

  const formTemplate = submission.formTemplateId as FormTemplate
  const submitter = submission.submitterId as UserType
  const workflowSteps = formTemplate.workflowId?.steps || []
  const workflowInstance = submission.workflowInstance || []

  const currentStepDetails = workflowSteps[submission.currentStep]
  const currentInstanceStep = workflowInstance[submission.currentStep]
  const isCurrentApprover = user && currentStepDetails && currentInstanceStep && (
    (currentInstanceStep.approverId && 
      (currentInstanceStep.approverId._id?.toString() || currentInstanceStep.approverId.toString()) === user._id.toString()) ||
    (!currentInstanceStep.approverId && 
      user.roleId === (currentStepDetails.roleId?._id?.toString() || currentStepDetails.roleId) &&
      user.departmentId?._id?.toString() === submitter.departmentId?._id?.toString())
  )
  const canApprove = submission.status === "pending" && isCurrentApprover

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/approvals")}
            className="border-blue-200 text-blue-600 hover:bg-blue-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-blue-800">{formTemplate?.name || "Không có tên biểu mẫu"}</h1>
            <p className="text-gray-600">Yêu cầu của {submitter?.name || "Không xác định"}</p>
          </div>
        </div>
        <Badge className={`${statusColors[submission.status as keyof typeof statusColors]} hover:bg-opacity-80 transition-colors duration-200`}>
          {statusLabels[submission.status as keyof typeof statusLabels]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-blue-800">Thông tin yêu cầu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Người gửi:</span>
                  <p className="text-sm text-gray-800">{submitter?.name || "Không xác định"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Phòng ban:</span>
                  <p className="text-sm text-gray-800">{submitter?.departmentId?.name || "Không có phòng ban"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Ngày gửi:</span>
                  <p className="text-sm text-gray-800">{new Date(submission.createdAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  })}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Ưu tiên:</span>
                  <p className={`text-sm font-medium ${priorityColors[submission.priority]}`}>
                    {submission.priority === "high" ? "Cao" : submission.priority === "medium" ? "Trung bình" : "Thấp"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-blue-800">Dữ liệu biểu mẫu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formTemplate?.fields && formTemplate.fields.length > 0 ? (
                formTemplate.fields.map((field: FormField) => {
                  const rawValue = submission.data[field.id] || submission.data[field.name] || "Không có dữ liệu"
                  let fieldValue = rawValue
                  if (field.type === "date" && rawValue) {
                    const date = new Date(rawValue)
                    fieldValue = date.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false
                    })
                  }
                  return (
                    <div key={field.id} className="border-b border-gray-200 pb-2 last:border-b-0 hover:bg-gray-50 transition-colors duration-200">
                      <p className="text-sm font-medium text-gray-700">{field.label || field.name}:</p>
                      {field.type === "file" ? (
                        submission.data[field.id] && submission.data[field.id].fileUrl ? (
                          <a
                            href={submission.data[field.id].fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center text-sm"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {submission.data[field.id].fileName || "Tệp đính kèm"}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500">Không có tệp đính kèm</p>
                        )
                      ) : (
                        <p className="text-sm text-gray-800">
                          {fieldValue}
                        </p>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500">Không có trường dữ liệu nào.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Users className="h-5 w-5 mr-2" />
                Luồng phê duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Tên luồng:</span>
                  <p className="text-sm text-gray-800">{formTemplate.workflowId?.name || "Không có tên luồng"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Các bước phê duyệt:</span>
                  <div className="mt-2 space-y-2">
                    {workflowSteps.length > 0 ? (
                      workflowSteps.map((step, index) => {
                        const instanceStep = workflowInstance[index]
                        const isCompleted = instanceStep && instanceStep.status === "approved"
                        const isCurrent = index === submission.currentStep
                        const isRejected = instanceStep && instanceStep.status === "rejected"
                        const isFeedbackRequested = instanceStep && instanceStep.status === "feedback"
                        const stepStatus = isCompleted ? "Đã hoàn thành" : isRejected ? "Đã từ chối" : isFeedbackRequested ? "Yêu cầu phản hồi" : isCurrent ? "Đang chờ" : "Chưa bắt đầu"
                        const statusClass = 
                          isCompleted
                          ? "bg-green-100 text-green-800"
                          : isRejected
                          ? "bg-red-100 text-red-800"
                          : isFeedbackRequested
                          ? "bg-blue-100 text-blue-800"
                          : isCurrent
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                        return (
                          <div key={step._id || index} className={`text-xs p-2 rounded ${statusClass} hover:bg-opacity-80 transition-colors duration-200`}>
                            <span className="font-medium">Bước {index + 1}:</span>{" "}
                            {step.roleId?.displayName || step.roleId?.toString() || "Không xác định"} ({stepStatus})
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-gray-500">Không có bước phê duyệt nào.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-blue-800">Lịch sử phê duyệt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submission.approvalHistory.length > 0 ? (
                  submission.approvalHistory.map((historyItem, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        {historyItem.action === "approve" && <Check className="h-4 w-4 text-green-600" />}
                        {historyItem.action === "reject" && <X className="h-4 w-4 text-red-600" />}
                        {historyItem.action === "feedback" && <MessageSquare className="h-4 w-4 text-blue-600" />}
                        {historyItem.action === "submitted" && <FileText className="h-4 w-4 text-gray-600" />}
                        <span className="text-gray-800">
                          {(historyItem.approverId as any)?.name || "Hệ thống"} đã{" "}
                          {actionLabels[historyItem.action as keyof typeof actionLabels]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="inline-block h-3 w-3 mr-1" />
                        {new Date(historyItem.timestamp).toLocaleString()}
                      </p>
                      {historyItem.comment && (
                        <p className="text-sm text-gray-700 mt-1 italic">"{historyItem.comment}"</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Chưa có lịch sử phê duyệt.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {canApprove ? (
            <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-blue-800">Hành động phê duyệt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comment" className="text-gray-700">Lí do (Nếu từ chối hoặc phản hồi biểu mẫu)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Nhập lí do..."
                    rows={3}
                    disabled={isApproving || isRejecting || isFeedbacking}
                    className="border-blue-200 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 transition-colors duration-200"
                    onClick={() => handleAction("approve")}
                    disabled={isApproving || isRejecting || isFeedbacking}
                  >
                    <ButtonLoading isLoading={isApproving} loadingText="Đang duyệt...">
                      <Check className="h-4 w-4 mr-2" />
                      Duyệt
                    </ButtonLoading>
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 transition-colors duration-200"
                    onClick={() => handleAction("reject")}
                    disabled={isApproving || isRejecting || isFeedbacking}
                  >
                    <ButtonLoading isLoading={isRejecting} loadingText="Đang từ chối...">
                      <X className="h-4 w-4 mr-2" />
                      Từ chối
                    </ButtonLoading>
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                    onClick={() => handleAction("feedback")}
                    disabled={isApproving || isRejecting || isFeedbacking}
                  >
                    <ButtonLoading isLoading={isFeedbacking} loadingText="Đang gửi...">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Phản hồi
                    </ButtonLoading>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
              <CardContent>
                <p className="text-sm text-gray-600">
                  Bạn không thể thực hiện hành động phê duyệt. Vui lòng kiểm tra vai trò, phòng ban hoặc trạng thái biểu mẫu.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}