import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreateUserForm } from "@/components/users/create-user-form"

export default function CreateUserPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Tạo người dùng mới</h1>
      <CreateUserForm />
    </DashboardLayout>
  )
}
