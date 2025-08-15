import { CreateFormWizard } from "@/components/forms/create-form-wizard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function CreateFormPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Tạo Biểu mẫu Mới</h1>
      <CreateFormWizard />
    </DashboardLayout>
  )
}
