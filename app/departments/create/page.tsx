import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreateDepartmentForm } from "@/components/departments/create-department-form"

export default function CreateDepartmentPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Tạo Phòng ban mới</h1>
      <CreateDepartmentForm />
    </DashboardLayout>
  )
}
