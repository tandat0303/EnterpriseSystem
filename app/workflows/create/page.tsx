import { CreateWorkflowForm } from "@/components/workflows/create-workflow-form"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function CreateWorkflowPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Tạo Luồng Phê duyệt Mới</h1>
      <CreateWorkflowForm />
    </DashboardLayout>
  )
}
