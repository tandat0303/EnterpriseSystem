import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreateRoleForm } from "@/components/roles/create-role-form"

export default function CreateRolePage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tạo Vai trò Mới</h1>
      </div>
      <CreateRoleForm />
    </DashboardLayout>
  )
}