import { UsersList } from "@/components/users/users-list"
import { CreateUserButton } from "@/components/users/create-user-button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý Người dùng</h1>
        <CreateUserButton />
      </div>
      <UsersList />
    </DashboardLayout>
  )
}
