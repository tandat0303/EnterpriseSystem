import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RoleDetail } from "@/components/roles/role-detail"

export default function RoleDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chi tiết Vai trò</h1>
      </div>
      <RoleDetail roleId={params.id} />
    </DashboardLayout>
  )
}