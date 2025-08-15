"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingCard, LoadingSpinner } from "@/components/ui/loading"
import { Search, Edit, Trash2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { FormTemplate, Workflow, User, Department } from "@/types"
import { ViewToggleButton } from "@/components/ui/view-toggle-button"

export function FormsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const router = useRouter()
  const { toast } = useToast()

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const queryParams: Record<string, string> = {}
      if (categoryFilter !== "all") queryParams.category = categoryFilter
      if (statusFilter !== "all") queryParams.status = statusFilter
      if (searchTerm) queryParams.searchTerm = searchTerm

      const [formsData, departmentsData] = await Promise.all([
        apiClient.get<FormTemplate[]>("/api/forms", { params: queryParams }),
        apiClient.get<Department[]>("/api/departments", { params: { status: "active" } }),
      ])

      setForms(Array.isArray(formsData) ? formsData : [])
      setDepartments(Array.isArray(departmentsData) ? departmentsData : [])
    } catch (error: any) {
      console.error("Failed to fetch forms or departments:", error)
      setForms([])
      setDepartments([])
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách biểu mẫu hoặc phòng ban.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [categoryFilter, statusFilter])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== "") {
        setIsSearching(true)
      }
      fetchData()
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
    router.push(`/forms/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/forms/${id}/edit`)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa biểu mẫu "${name}"?`)) {
      return
    }
    try {
      await apiClient.delete(`/api/forms/${id}`)
      toast({
        title: "Đã xóa biểu mẫu",
        description: `Biểu mẫu "${name}" đã được xóa thành công`,
      })
      fetchData()
    } catch (error: any) {
      console.error("Delete form failed:", error)
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
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
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
          {isSearching && <LoadingSpinner size="sm" className="absolute right-3 top-1/2 transform -translate-y-1/2" />}
          <Input
            placeholder="Tìm kiếm biểu mẫu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 border-blue-200 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
          disabled={departments.length === 0}
        >
          <option value="all">Tất cả phòng ban</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
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
        {Array.isArray(forms) &&
          forms.map((form, index) => (
            <Card
              key={form._id}
              className={`bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300 animate-fade-in ${
                viewMode === "list" ? "w-full py-2 px-3" : ""
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className={`${viewMode === "list" ? "p-2" : ""}`}>
                <div className="flex items-start justify-between">
                  <CardTitle className={`text-blue-800 ${viewMode === "list" ? "text-sm" : "text-lg"}`}>{form.name}</CardTitle>
                  <Badge
                    className={`${statusColors[form.status as keyof typeof statusColors]} ${
                      viewMode === "list" ? "text-xs py-0.5 px-1" : ""
                    } transition-colors duration-200`}
                  >
                    {statusLabels[form.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                {form.description && viewMode === "grid" && <p className="text-sm text-gray-600">{form.description}</p>}
              </CardHeader>
              <CardContent className={`${viewMode === "list" ? "p-2" : ""}`}>
                <div className={`space-y-2 ${viewMode === "list" ? "text-sm" : ""}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Danh mục:</span>
                    <span className="font-medium">
                      {departments.find((dept) => dept.name === form.category)?.name || "Không xác định"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Luồng phê duyệt:</span>
                    <span className="font-medium">{(form.workflowId as Workflow)?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Người tạo:</span>
                    <span className="font-medium">{(form.createdBy as User)?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span className="font-medium">
                      {new Date(form.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số lượt sử dụng:</span>
                    <span className="font-medium">{form.usageCount}</span>
                  </div>
                  <div className={`flex space-x-2 ${viewMode === "list" ? "justify-end" : "pt-2"}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`${
                        viewMode === "list" ? "p-1 h-8 w-8" : "flex-1"
                      } bg-transparent border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200`}
                      onClick={() => handleView(form._id)}
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
                      onClick={() => handleEdit(form._id)}
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
                      onClick={() => handleDelete(form._id, form.name)}
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

      {forms.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Không tìm thấy biểu mẫu nào</p>
          <p className="text-gray-400 text-sm mt-2">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
        </div>
      )}
    </div>
  )
}