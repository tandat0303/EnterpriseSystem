import { redirect } from "next/navigation"
import { EditFormWizard } from "@/components/forms/edit-form-wizard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function EditFormPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    redirect("/forms")
  }
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Chỉnh sửa Biểu mẫu</h1>
      <EditFormWizard formId={params.id} />
    </DashboardLayout>
  )
}
