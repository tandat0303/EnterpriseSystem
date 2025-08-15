import { redirect } from "next/navigation"
import { FormDetail } from "@/components/forms/form-detail"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function FormDetailPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    redirect("/forms")
  }
  return (
    <DashboardLayout>
      <FormDetail formId={params.id} />
    </DashboardLayout>
  )
}
