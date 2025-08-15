import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserDetail } from "@/components/users/user-detail"

export default function UserDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <UserDetail userId={params.id} />
    </DashboardLayout>
  )
}
