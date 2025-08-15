import { EditWorkflowForm } from "@/components/workflows/edit-workflow-form"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function EditWorkflowPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Chỉnh sửa Luồng Phê duyệt</h1>
      <EditWorkflowForm workflowId={params.id} />
    </DashboardLayout>
  )
}
