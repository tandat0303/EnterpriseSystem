"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LoadingSkeleton } from "@/components/ui/loading"
import type { FormTemplate } from "@/types"
import { apiClient } from "@/lib/api-client"

export function RecentForms() {
  const [recentForms, setRecentForms] = useState<FormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchRecentForms = async () => {
      setIsLoading(true)
      try {
        const data: FormTemplate[] = await apiClient.get("/api/forms")
        const sortedForms = data
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
        setRecentForms(sortedForms)
      } catch (error) {
        console.error("Error fetching recent forms:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách biểu mẫu gần đây.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecentForms()
  }, [toast])

  const handleViewForm = (id: string) => {
    router.push(`/forms/${id}`)
  }

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-gray-800">Biểu mẫu gần đây</CardTitle>
        <FileText className="h-5 w-5 text-blue-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} lines={2} className="h-12" />
            ))}
          </div>
        ) : recentForms.length > 0 ? (
          <div className="space-y-4">
            {recentForms.map((form) => (
              <div
                key={form._id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-blue-50 transition-colors duration-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{form.name}</p>
                  <p className="text-sm text-gray-600">{form.category}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewForm(form._id)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                  Xem <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Không có biểu mẫu gần đây nào.</p>
        )}
      </CardContent>
    </Card>
  )
}