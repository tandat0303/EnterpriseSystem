import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EditRoleForm } from "@/components/roles/edit-role-form"

export default function EditRolePage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chỉnh sửa Vai trò</h1>
      </div>
      <EditRoleForm roleId={params.id} />
    </DashboardLayout>
  )
}