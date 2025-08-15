import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SubmissionDetailView } from "@/components/submissions/submission-detail-view"
import { redirect } from "next/navigation"

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    redirect("/my-submissions")
  }
  return (
    <DashboardLayout>
      <SubmissionDetailView submissionId={params.id} />
    </DashboardLayout>
  )
}
