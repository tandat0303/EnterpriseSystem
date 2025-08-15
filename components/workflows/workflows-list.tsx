"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingCard, LoadingSpinner } from "@/components/ui/loading"
import { Search, Edit, Trash2, Eye, Workflow as WorkflowIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Workflow, User, Role, FormTemplate } from "@/types"
import { ViewToggleButton } from "@/components/ui/view-toggle-button"

export function WorkflowsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const router = useRouter()
  const { toast } = useToast()

  const fetchWorkflows = async () => {
    setIsLoading(true)
    try {
      const queryParams: Record<string, string> = {}
      if (statusFilter !== "all") queryParams.status = statusFilter
      if (searchTerm) queryParams.searchTerm = searchTerm

      const data: Workflow[] = await apiClient.get("/api/workflows", { params: queryParams })
      if (Array.isArray(data)) {
        setWorkflows(data)
      } else {
        console.error("API /api/workflows did not return an array:", data)
        setWorkflows([])
        toast({
          title: "Lỗi dữ liệu",
          description: "Dữ liệu luồng phê duyệt không hợp lệ.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to fetch workflows:", error)
      setWorkflows([])
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách luồng phê duyệt.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchWorkflows()
  }, [statusFilter])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== "") {
        setIsSearching(true)
      }
      fetchWorkflows()
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const statusColors = {
    active: "bg-green-100 text-green-800 hover:bg-green-200",
    draft: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    inactive: "bg-red-100 text-red-800 hover:bg-red-200",
  }

  const statusLabels = {
    active: "Hoạt động",
    draft: "Bản nháp",
    inactive: "Không hoạt động",
  }

  const handleView = (id: string) => {
    router.push(`/workflows/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/workflows/${id}/edit`)
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      const formsUsingWorkflow: FormTemplate[] = await apiClient.get(`/api/forms/?workflowId=${id}`)
      if (formsUsingWorkflow.length > 0) {
        toast({
          title: "Không thể xóa luồng phê duyệt",
          description: `Luồng phê duyệt "${name}" đang được sử dụng bởi ${formsUsingWorkflow.length} biểu mẫu. Vui lòng cập nhật hoặc xóa các biểu mẫu liên quan trước.`,
          variant: "destructive",
        })
        return
      }

      if (!confirm(`Bạn có chắc chắn muốn xóa luồng phê duyệt "${name}"?`)) {
        return
      }

      await apiClient.delete(`/api/workflows/${id}`)
      toast({
        title: "Đã xóa luồng phê duyệt",
        description: `Luồng phê duyệt "${name}" đã được xóa thành công`,
      })
      fetchWorkflows()
    } catch (error: any) {
      console.error("Delete workflow failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa luồng phê duyệt.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingCard key={i} className="bg-gradient-to-br from-gray-50 to-white" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
          {isSearching && <LoadingSpinner size="sm" className="absolute right-3 top-1/2 transform -translate-y-1/2" />}
          <Input
            placeholder="Tìm kiếm luồng phê duyệt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 border-blue-200 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="draft">Bản nháp</option>
          <option value="inactive">Không hoạt động</option>
        </select>
        <ViewToggleButton viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}`}>
        {workflows.map((wf, index) => (
          <Card
            key={wf._id}
            className={`bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300 animate-fade-in ${
              viewMode === "list" ? "w-full py-2 px-3" : ""
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className={`${viewMode === "list" ? "p-2" : "pb-2"}`}>
              <div className="flex items-start justify-between">
                <CardTitle className={`flex items-center ${viewMode === "list" ? "text-sm" : "text-lg"} text-blue-800`}>
                  <WorkflowIcon className={`mr-2 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"} text-blue-600`} />
                  {wf.name}
                </CardTitle>
                <Badge
                  className={`${statusColors[wf.status as keyof typeof statusColors]} ${
                    viewMode === "list" ? "text-xs py-0.5 px-1" : ""
                  } transition-colors duration-200`}
                >
                  {statusLabels[wf.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              {wf.description && viewMode === "grid" && <p className="text-sm text-gray-600">{wf.description}</p>}
            </CardHeader>
            <CardContent className={`${viewMode === "list" ? "p-2" : "pt-0"}`}>
              <div className={`space-y-2 ${viewMode === "list" ? "text-sm" : ""}`}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số bước:</span>
                  <span className="font-medium">{wf.steps.length}</span>
                </div>
                {viewMode === "grid" && (
                  <div className="text-sm">
                    <span className="text-gray-600">Các bước chính:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {wf.steps.slice(0, 3).map((step: any, stepIdx) => (
                        <Badge key={stepIdx} variant="secondary" className="text-xs">
                          {(step.roleId as Role)?.displayName || "N/A"}
                        </Badge>
                      ))}
                      {wf.steps.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{wf.steps.length - 3} nữa
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Người tạo:</span>
                  <span className="font-medium">{(wf.createdBy as User)?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="font-medium">
                    {new Date(wf.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số lượt sử dụng:</span>
                  <span className="font-medium">{wf.usageCount}</span>
                </div>
                <div className={`flex space-x-2 ${viewMode === "list" ? "justify-end" : "pt-2"}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${
                      viewMode === "list" ? "p-1 h-8 w-8" : "flex-1"
                    } bg-transparent border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200`}
                    onClick={() => handleView(wf._id)}
                  >
                    <Eye className="h-4 w-4" />
                    {viewMode === "grid" && <span className="ml-1">Xem</span>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${
                      viewMode === "list" ? "p-1 h-8 w-8" : "flex-1"
                    } bg-transparent border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200`}
                    onClick={() => handleEdit(wf._id)}
                  >
                    <Edit className="h-4 w-4" />
                    {viewMode === "grid" && <span className="ml-1">Sửa</span>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${
                      viewMode === "list" ? "p-1 h-8 w-8" : ""
                    } text-red-600 border-red-600 hover:bg-red-50 bg-transparent transition-colors duration-200`}
                    onClick={() => handleDelete(wf._id, wf.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {viewMode === "grid" && <span className="ml-1">Xóa</span>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Không tìm thấy luồng phê duyệt nào</p>
          <p className="text-gray-400 text-sm mt-2">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
        </div>
      )}
    </div>
  )
}