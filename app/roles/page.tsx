import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RolesList } from "@/components/roles/roles-list"
import { CreateRoleButton } from "@/components/roles/create-role-button"

export default function RolesPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Vai trò</h1>
        <CreateRoleButton />
      </div>
      <RolesList />
    </DashboardLayout>
  )
}
