import { WorkflowsList } from "@/components/workflows/workflows-list"
import { CreateWorkflowButton } from "@/components/workflows/create-workflow-button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function WorkflowsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý Luồng Phê duyệt</h1>
        <CreateWorkflowButton />
      </div>
      <WorkflowsList />
    </DashboardLayout>
  )
}
