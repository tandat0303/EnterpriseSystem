import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EditDepartmentForm } from "@/components/departments/edit-department-form"

export default function EditDepartmentPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Chỉnh sửa Phòng ban</h1>
      <EditDepartmentForm departmentId={params.id} />
    </DashboardLayout>
  )
}
