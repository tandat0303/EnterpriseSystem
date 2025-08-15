"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ButtonLoading, LoadingCard } from "@/components/ui/loading"
import { PlusCircle, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import type { Workflow, Role, Department } from "@/types"

interface EditWorkflowFormProps {
  workflowId: string
}

export function EditWorkflowForm({ workflowId }: EditWorkflowFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    steps: [{ order: 1, roleId: "", departmentId: "", required: true, approverId: "" }],
    status: "draft",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [approvers, setApprovers] = useState<Record<string, { name: string }>>({})
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [workflowData, rolesData, departmentsData] = await Promise.all([
          apiClient.get<Workflow>(`/api/workflows/${workflowId}`),
          apiClient.get<Role[]>("/api/roles", { params: { status: "active" } }),
          apiClient.get<Department[]>("/api/departments", { params: { status: "active" } }),
        ])

        const mappedSteps = workflowData.steps.map((step: any) => ({
          order: step.order,
          roleId: step.roleId?._id || step.roleId,
          departmentId: step.departmentId?._id || step.departmentId || "",
          required: step.required,
          approverId: step.approverId?._id || step.approverId || "",
        }))

        setFormData({
          name: workflowData.name,
          description: workflowData.description,
          steps: mappedSteps,
          status: workflowData.status,
        })

        const approverIds = mappedSteps
          .filter((step) => step.approverId)
          .map((step) => step.approverId)
        if (approverIds.length > 0) {
          try {
            const users = await Promise.all(
              approverIds.map((id) =>
                apiClient.get<any>(`/api/users/${id}`).then((user) => ({ id, name: user.name || "Chưa xác định" }))
              )
            )
            setApprovers((prev) => ({
              ...prev,
              ...Object.fromEntries(users.map((user) => [user.id, { name: user.name }]))
            }))
          } catch (error: any) {
            console.error("Failed to fetch approvers:", error)
          }
        }

        if (Array.isArray(rolesData)) {
          setRoles(rolesData)
        } else {
          console.error("API /api/roles did not return an array:", rolesData)
          setRoles([])
        }

        if (Array.isArray(departmentsData)) {
          setDepartments(departmentsData)
        } else {
          console.error("API /api/departments did not return an array:", departmentsData)
          setDepartments([])
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
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
    fetchData()
  }, [workflowId, router, toast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Tên luồng phê duyệt phải có ít nhất 3 ký tự."
    }
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = "Mô tả luồng phê duyệt phải có ít nhất 10 ký tự."
    }
    if (!formData.steps || formData.steps.length === 0) {
      newErrors.steps = "Luồng phê duyệt phải có ít nhất một bước."
    } else {
      formData.steps.forEach((step, index) => {
        if (!step.roleId) {
          newErrors[`stepRole_${index}`] = `Bước ${index + 1}: Vui lòng chọn vai trò.`
        }
        if (step.departmentId && !departments.find((dept) => dept._id === step.departmentId)) {
          newErrors[`stepDepartment_${index}`] = `Bước ${index + 1}: Phòng ban không hợp lệ.`
        }
        const role = roles.find((r) => r._id === step.roleId)
        if (role?.displayName === "Trưởng phòng" && step.departmentId && !step.approverId) {
          newErrors[`stepApprover_${index}`] = `Bước ${index + 1}: Trưởng phòng chưa được gán.`
        }
      })
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => ({ ...prev, [id]: "" }))
  }

  const handleStepChange = async (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps]
    newSteps[index] = { ...newSteps[index], [field]: value }

    if (field === "roleId" || field === "departmentId") {
      const role = roles.find((r) => r._id === newSteps[index].roleId)
      if (newSteps[index].roleId && newSteps[index].departmentId) {
        const department = departments.find((dept) => dept._id === newSteps[index].departmentId)
        if (role?.displayName === "Trưởng phòng" && department?.managerId) {
          newSteps[index].approverId = department.managerId
          setApprovers((prev) => ({
            ...prev,
            [department.managerId]: { name: department.managerId.name || "Chưa xác định" },
          }))
        } else {
          try {
            const users = await apiClient.get<any[]>("/api/users", {
              params: { departmentId: newSteps[index].departmentId, roleId: newSteps[index].roleId },
            })
            if (users.length > 0) {
              let selectedUser = users[0]
              if (department?.managerId && role?.displayName !== "Trưởng phòng") {
                const usersWithRoles = users.map((user) => ({
                  ...user,
                  role: roles.find((r) => r._id === user.roleId),
                }))
                const maxLevelUser = usersWithRoles.reduce((maxUser, user) => {
                  const userLevel = user.role?.level || 0
                  const maxLevel = maxUser?.role?.level || 0
                  return userLevel > maxLevel ? user : maxUser
                }, usersWithRoles[0])
                selectedUser = maxLevelUser || users[0]
              }
              newSteps[index].approverId = selectedUser._id
              setApprovers((prev) => ({
                ...prev,
                [selectedUser._id]: { name: selectedUser.name || "Chưa xác định" },
              }))
            } else {
              const matchingStep = newSteps.find(
                (step, i) =>
                  i !== index &&
                  step.departmentId === newSteps[index].departmentId &&
                  step.roleId === newSteps[index].roleId &&
                  step.approverId
              )
              newSteps[index].approverId = matchingStep?.approverId || ""
            }
          } catch (error: any) {
            console.error("Failed to fetch users:", error)
            const matchingStep = newSteps.find(
              (step, i) =>
                i !== index &&
                step.departmentId === newSteps[index].departmentId &&
                step.roleId === newSteps[index].roleId &&
                step.approverId
            )
            newSteps[index].approverId = matchingStep?.approverId || ""
          }
        }
      } else {
        newSteps[index].approverId = ""
      }
    }

    setFormData((prev) => ({ ...prev, steps: newSteps }))
    setErrors((prev) => ({ ...prev, [`stepRole_${index}`]: "", [`stepDepartment_${index}`]: "", [`stepApprover_${index}`]: "" }))
  }

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { order: prev.steps.length + 1, roleId: "", departmentId: "", required: true, approverId: "" }],
    }))
  }

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order: i + 1 })),
    }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[`stepRole_${index}`]
      delete newErrors[`stepDepartment_${index}`]
      delete newErrors[`stepApprover_${index}`]
      return newErrors
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại các trường thông tin.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const formsUsingWorkflow = await apiClient.get(`/api/forms?workflowId=${workflowId}`)
      if (formsUsingWorkflow.length > 0) {
        const pendingSubmissions = await apiClient.get(
          `/api/submissions?formTemplateId=${formsUsingWorkflow.map((form: any) => form._id).join(",")}&status=pending`
        )
        if (pendingSubmissions.length > 0) {
          toast({
            title: "Không thể cập nhật luồng phê duyệt",
            description: `Luồng phê duyệt "${formData.name}" đang được sử dụng bởi ${pendingSubmissions.length} biểu mẫu đang chờ duyệt. Vui lòng xử lý các biểu mẫu này trước khi cập nhật.`,
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }
      }

      await apiClient.put(`/api/workflows/${workflowId}`, formData)
      toast({
        title: "Thành công",
        description: "Luồng phê duyệt đã được cập nhật thành công!",
      })
      router.push(`/workflows/${workflowId}`)
    } catch (error: any) {
      console.error("Update workflow failed:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật luồng phê duyệt.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
        <LoadingCard className="h-[600px]">
          <div className="space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border p-4 rounded-md space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/4" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </LoadingCard>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm">
      <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-blue-800">Chỉnh sửa luồng phê duyệt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-gray-700">Tên luồng phê duyệt *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Luồng phê duyệt tài chính"
                disabled={isSaving || isLoading}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-700">Mô tả *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về mục đích và các bước của luồng phê duyệt này."
                disabled={isSaving || isLoading}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <div>
              <Label htmlFor="status" className="text-gray-700">Trạng thái</Label>
              <select
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving || isLoading}
              >
                <option value="draft">Bản nháp</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
            <h3 className="text-lg font-semibold mt-6 mb-4 text-blue-800">Các bước phê duyệt</h3>
            {formData.steps.map((step, index) => (
              <div
                key={index}
                className="border border-blue-200 p-4 rounded-md space-y-3 relative bg-white hover:bg-blue-50 transition-colors duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h4 className="font-medium text-blue-700">Bước {step.order}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`roleId-${index}`} className="text-gray-700">Vai trò phê duyệt *</Label>
                    <select
                      id={`roleId-${index}`}
                      value={step.roleId}
                      onChange={(e) => handleStepChange(index, "roleId", e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSaving || isLoading}
                    >
                      <option value="">{isLoading ? "Đang tải..." : "Chọn vai trò"}</option>
                      {Array.isArray(roles) &&
                        roles.map((role) => (
                          <option key={role._id} value={role._id}>
                            {role.displayName} (Cấp {role.level})
                          </option>
                        ))}
                    </select>
                    {errors[`stepRole_${index}`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`stepRole_${index}`]}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`departmentId-${index}`} className="text-gray-700">Phòng ban (Tùy chọn)</Label>
                    <select
                      id={`departmentId-${index}`}
                      value={step.departmentId}
                      onChange={(e) => handleStepChange(index, "departmentId", e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSaving || isLoading}
                    >
                      <option value="">{isLoading ? "Đang tải..." : "Chọn phòng ban"}</option>
                      {Array.isArray(departments) &&
                        departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name}
                          </option>
                        ))}
                    </select>
                    {errors[`stepDepartment_${index}`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`stepDepartment_${index}`]}</p>
                    )}
                  </div>
                </div>
                {step.approverId && (
                  <div className="text-sm text-gray-600">
                    Người phê duyệt: {approvers[step.approverId]?.name || "Chưa xác định"}
                  </div>
                )}
                <div>
                  <Label htmlFor={`required-${index}`} className="text-gray-700">Bắt buộc</Label>
                  <input
                    type="checkbox"
                    id={`required-${index}`}
                    checked={step.required}
                    onChange={(e) => handleStepChange(index, "required", e.target.checked)}
                    className="ml-2"
                    disabled={isSaving || isLoading}
                  />
                </div>
                {formData.steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="absolute top-2 right-2 text-red-500 hover:bg-red-50"
                    disabled={isSaving || isLoading}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.steps && <p className="text-red-500 text-sm mt-1">{errors.steps}</p>}
            <Button
              type="button"
              variant="outline"
              onClick={addStep}
              disabled={isSaving || isLoading}
              className="border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Thêm bước phê duyệt
            </Button>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              disabled={isSaving || isLoading}
            >
              <ButtonLoading isLoading={isSaving} loadingText="Đang lưu...">
                Lưu thay đổi
              </ButtonLoading>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}