import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EditPermissionForm } from "@/components/permissions/edit-permission-form"

export default function EditPermissionPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chỉnh sửa Quyền hạn</h1>
      </div>
      <EditPermissionForm permissionId={params.id} />
    </DashboardLayout>
  )
}