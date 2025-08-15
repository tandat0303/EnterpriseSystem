import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DepartmentsList } from "@/components/departments/departments-list"
import { CreateDepartmentButton } from "@/components/departments/create-department-button"

export default function DepartmentsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Phòng ban</h1>
        <CreateDepartmentButton />
      </div>
      <DepartmentsList />
    </DashboardLayout>
  )
}
