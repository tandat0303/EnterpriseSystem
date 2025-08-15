import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PermissionDetail } from "@/components/permissions/permission-detail"

export default function PermissionDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chi tiết Quyền hạn</h1>
      </div>
      <PermissionDetail permissionId={params.id} />
    </DashboardLayout>
  )
}