import { WorkflowDetail } from "@/components/workflows/workflow-detail"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <WorkflowDetail workflowId={params.id} />
    </DashboardLayout>
  )
}
