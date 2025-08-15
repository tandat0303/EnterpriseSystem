import { FormsList } from "@/components/forms/forms-list"
import { CreateFormButton } from "@/components/forms/create-form-button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function FormsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý Biểu mẫu</h1>
        <CreateFormButton />
      </div>
      <FormsList />
    </DashboardLayout>
  )
}
