import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreatePermissionForm } from "@/components/permissions/create-permission-form"

export default function CreatePermissionPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tạo Quyền hạn Mới</h1>
      </div>
      <CreatePermissionForm />
    </DashboardLayout>
  )
}