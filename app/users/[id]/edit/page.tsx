import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EditUserForm } from "@/components/users/edit-user-form"

export default function EditUserPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Chỉnh sửa người dùng</h1>
      <EditUserForm userId={params.id} />
    </DashboardLayout>
  )
}
