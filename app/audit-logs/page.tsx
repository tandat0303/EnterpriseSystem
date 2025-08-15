import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AuditLogsList } from "@/components/audit-logs/audit-logs-list"

export default function AuditLogsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lịch sử Hoạt động</h1>
      </div>
      <AuditLogsList />
    </DashboardLayout>
  )
}
