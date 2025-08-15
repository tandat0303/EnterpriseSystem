import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { NotificationsList } from "@/components/notifications/notifications-list"

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Thông báo</h1>
      </div>
      <NotificationsList />
    </DashboardLayout>
  )
}
