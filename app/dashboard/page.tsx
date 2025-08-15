import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentForms } from "@/components/dashboard/recent-forms"
import { PendingApprovals } from "@/components/dashboard/pending-approvals"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Tổng quan</h1>
      <div className="space-y-8">
        <DashboardStats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentForms />
          <PendingApprovals />
        </div>
      </div>
    </DashboardLayout>
  )
}
