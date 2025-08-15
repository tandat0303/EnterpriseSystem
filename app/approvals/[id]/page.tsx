import { ApprovalDetail } from "@/components/approvals/approval-detail"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { redirect } from "next/navigation"

export default function ApprovalDetailPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    redirect("/approvals")
  }
  return (
    <DashboardLayout>
      <ApprovalDetail approvalId={params.id} />
    </DashboardLayout>
  )
}