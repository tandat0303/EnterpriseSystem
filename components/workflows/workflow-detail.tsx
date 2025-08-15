"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, ListOrdered, Calendar, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Workflow, FormTemplate, FormSubmission } from "@/types"
import { LoadingCard, LoadingSkeleton } from "@/components/ui/loading"
import { apiClient } from "@/lib/api-client"

interface WorkflowDetailProps {
  workflowId: string
}

export function WorkflowDetail({ workflowId }: WorkflowDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingForms, setIsLoadingForms] = useState(true)

  useEffect(() => {
    const fetchWorkflow = async () => {
      setIsLoading(true)
      try {
        const data: Workflow = await apiClient.get(`/api/workflows/${workflowId}`)
        setWorkflow(data)
      } catch (error: any) {
        console.error("Error fetching workflow:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin luồng phê duyệt.",
          variant: "destructive",
        })
        router.push("/workflows")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchRelatedFormsAndSubmissions = async () => {
      setIsLoadingForms(true)
      try {
        const forms: FormTemplate[] = await apiClient.get(`/api/forms?workflowId=${workflowId}`)
        setFormTemplates(forms)

        if (forms.length > 0) {
          const formTemplateIds = forms.map((form) => form._id).join(",")
          const submissions: FormSubmission[] = await apiClient.get(
            `/api/submissions?formTemplateId=${formTemplateIds}&status=pending`
          )
          const submissionCounts: Record<string, number> = {}
          forms.forEach((form) => {
            submissionCounts[form._id] = submissions.filter(
              (sub) => sub.formTemplateId.toString() === form._id
            ).length
          })
          setPendingSubmissions(submissionCounts)
        }
      } catch (error: any) {
        console.error("Error fetching related forms or submissions:", error)
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách biểu mẫu liên quan hoặc đơn gửi.",
          variant: "destructive",
        })
        setFormTemplates([])
        setPendingSubmissions({})
      } finally {
        setIsLoadingForms(false)
      }
    }

    fetchWorkflow()
    fetchRelatedFormsAndSubmissions()
  }, [workflowId, router, toast])

  const handleDelete = async () => {
    if (!workflow) return

    try {
      const formsUsingWorkflow: FormTemplate[] = await apiClient.get(`/api/forms?workflowId=${workflow._id}`)
      if (formsUsingWorkflow.length > 0) {
        toast({
          title: "Không thể xóa luồng phê duyệt",
          description: `Luồng phê duyệt "${workflow.name}" đang được sử dụng bởi ${formsUsingWorkflow.length} biểu mẫu. Vui lòng cập nhật hoặc xóa các biểu mẫu liên quan trước.`,
          variant: "destructive",
        })
        return
      }

      if (!confirm(`Bạn có chắc chắn muốn xóa luồng phê duyệt "${workflow.name}"?`)) {
        return
      }

      await apiClient.delete(`/api/workflows/${workflow._id}`)
      toast({
        title: "Đã xóa luồng phê duyệt",
        description: `Luồng phê duyệt "${workflow.name}" đã được xóa thành công`,
      })
      router.push("/workflows")
    } catch (error: any) {
      console.error("Delete workflow failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa luồng phê duyệt.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!workflow) return

    try {
      const submissions = await apiClient.get(`/api/submissions?formTemplateId=${formTemplates.map((form) => form._id).join(",")}&status=pending`)
      if (submissions.length > 0) {
        toast({
          title: "Không thể chỉnh sửa luồng phê duyệt",
          description: `Luồng phê duyệt "${workflow.name}" đang được sử dụng bởi ${submissions.length} biểu mẫu đang chờ duyệt. Vui lòng xử lý các biểu mẫu này trước khi chỉnh sửa.`,
          variant: "destructive",
        })
        return
      }

      router.push(`/workflows/${workflow._id}/edit`)
    } catch (error: any) {
      console.error("Check pending submissions failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể kiểm tra trạng thái biểu mẫu.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
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
            <LoadingCard className="h-48 bg-gradient-to-br from-gray-50 to-white" />
            <LoadingCard className="h-64 bg-gradient-to-br from-gray-50 to-white" />
          </div>
          <div className="space-y-6">
            <LoadingCard className="h-48 bg-gradient-to-br from-gray-50 to-white" />
            <LoadingCard className="h-48 bg-gradient-to-br from-gray-50 to-white" />
          </div>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <div className="text-center py-12 text-gray-500">Không tìm thấy luồng phê duyệt.</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/workflows")}
            className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-blue-800">{workflow.name}</h1>
            <p className="text-gray-600">{workflow.description}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent transition-colors duration-200"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-blue-800">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Ngày tạo:</span>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" /> {new Date(workflow.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Ngày cập nhật:</span>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" /> {new Date(workflow.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <ListOrdered className="h-5 w-5 mr-2" />
                Các bước phê duyệt ({workflow.steps.length} bước)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflow.steps.length > 0 ? (
                  workflow.steps.map((step, index) => (
                    <div
                      key={step.order}
                      className="p-4 border border-blue-200 rounded-lg bg-white hover:bg-blue-50 transition-colors duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-blue-700">
                          Bước {index + 1}: {(step.roleId as any)?.displayName || "Vai trò không xác định"}
                        </h3>
                        {step.required && <Badge variant="outline" className="border-blue-200 text-blue-600">Bắt buộc</Badge>}
                      </div>
                      {step.departmentId && (
                        <div className="mt-2 text-sm text-gray-600">
                          Phòng ban: {(step.departmentId as any)?.name || "Phòng ban không xác định"}
                        </div>
                      )}
                      {(step.roleId as any)?.displayName === "Trưởng phòng" && step.approverId && (
                        <div className="mt-2 text-sm text-gray-600">
                          Trưởng phòng: {(step.approverId as any)?.name || "Chưa xác định"}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Không có bước phê duyệt nào được định nghĩa.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-blue-800">Biểu mẫu liên quan</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingForms ? (
                <LoadingSkeleton className="h-24" />
              ) : formTemplates.length > 0 ? (
                <div className="space-y-2">
                  {formTemplates.map((form, index) => (
                    <div
                      key={form._id}
                      className="flex items-center justify-between p-2 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => router.push(`/forms/${form._id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-800">{form.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="border-blue-200 text-blue-600">{form.status}</Badge>
                        {pendingSubmissions[form._id] > 0 && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            {pendingSubmissions[form._id]} đang chờ duyệt
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có biểu mẫu nào sử dụng luồng này.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}