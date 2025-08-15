"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingCard, LoadingSpinner } from "@/components/ui/loading"
import { Search, Edit, Trash2, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Department, User } from "@/types"
import { ViewToggleButton } from "@/components/ui/view-toggle-button"

export function DepartmentsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const router = useRouter()
  const { toast } = useToast()

  const fetchDepartments = async () => {
    setIsLoading(true)
    try {
      const queryParams: Record<string, string> = {}
      if (statusFilter !== "all") queryParams.includeInactive = "true"
      if (searchTerm) queryParams.searchTerm = searchTerm

      const data: Department[] = await apiClient.get("/api/departments", { params: queryParams })
      if (Array.isArray(data)) {
        setDepartments(data)
      } else {
        console.error("API /api/departments did not return an array:", data)
        setDepartments([])
        toast({
          title: "Lỗi dữ liệu",
          description: "Dữ liệu phòng ban không hợp lệ.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to fetch departments:", error)
      setDepartments([])
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách phòng ban.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [statusFilter])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== "") {
        setIsSearching(true)
      }
      fetchDepartments()
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    active: "Hoạt động",
    inactive: "Không hoạt động",
  }

  const handleEdit = (id: string) => {
    router.push(`/departments/${id}/edit`)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phòng ban "${name}"?`)) {
      return
    }
    try {
      await apiClient.delete(`/api/departments/${id}`)
      toast({
        title: "Đã xóa phòng ban",
        description: `Phòng ban "${name}" đã được xóa thành công`,
      })
      fetchDepartments()
    } catch (error: any) {
      console.error("Delete department failed:", error)
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
          {isSearching && <LoadingSpinner size="sm" className="absolute right-3 top-1/2 transform -translate-y-1/2" />}
          <Input
            placeholder="Tìm kiếm phòng ban..."
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
          <option value="inactive">Không hoạt động</option>
        </select>
        <ViewToggleButton viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}`}>
        {departments.map((dept) => (
          <Card
            key={dept._id}
            className={`bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300 ${
              viewMode === "list" ? "w-full py-2 px-3" : ""
            }`}
          >
            <CardHeader className={`${viewMode === "list" ? "p-2" : ""}`}>
              <div className="flex items-start justify-between">
                <CardTitle className={`flex items-center ${viewMode === "list" ? "text-sm" : "text-lg"} text-blue-800`}>
                  <Building className={`mr-2 ${viewMode === "list" ? "h-4 w-4" : "h-5 w-5"}`} />
                  {dept.name}
                </CardTitle>
                <Badge
                  className={`${statusColors[dept.status as keyof typeof statusColors]} ${
                    viewMode === "list" ? "text-xs py-0.5 px-1" : ""
                  } hover:bg-opacity-80 transition-colors duration-200`}
                >
                  {statusLabels[dept.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              {dept.description && viewMode === "grid" && <p className="text-sm text-gray-600">{dept.description}</p>}
            </CardHeader>
            <CardContent className={`${viewMode === "list" ? "p-2" : ""}`}>
              <div className={`space-y-2 ${viewMode === "list" ? "text-sm" : ""}`}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã phòng ban:</span>
                  <span className="font-medium text-gray-800">{dept.code || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trưởng phòng:</span>
                  <span className="font-medium text-gray-800">{(dept.managerId as User)?.name || "Chưa có"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="font-medium text-gray-800">
                    {new Date(dept.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className={`flex space-x-2 ${viewMode === "list" ? "justify-end" : "pt-2"}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${
                      viewMode === "list" ? "p-1 h-8 w-8" : "flex-1"
                    } border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200`}
                    onClick={() => handleEdit(dept._id)}
                  >
                    <Edit className="h-4 w-4" />
                    {viewMode === "grid" && <span className="ml-1">Sửa</span>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${
                      viewMode === "list" ? "p-1 h-8 w-8" : ""
                    } text-red-600 border-red-600 hover:bg-red-50 transition-colors duration-200`}
                    onClick={() => handleDelete(dept._id, dept.name)}
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

      {departments.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Không tìm thấy phòng ban nào</p>
          <p className="text-gray-500 text-sm mt-2">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
        </div>
      )}
    </div>
  )
}