import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PermissionsList } from "@/components/permissions/permissions-list"
import { CreatePermissionButton } from "@/components/permissions/create-permission-button"

export default function PermissionsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Phân quyền</h1>
        <CreatePermissionButton />
      </div>
      <PermissionsList />
    </DashboardLayout>
  )
}