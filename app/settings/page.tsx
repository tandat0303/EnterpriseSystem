import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SettingsPage } from "@/components/settings/settings-page"

export default function Settings() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Cài đặt Hệ thống</h1>
      <SettingsPage />
    </DashboardLayout>
  )
}
