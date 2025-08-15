"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateRoleButton() {
  const router = useRouter()
  return (
    <Button onClick={() => router.push("/roles/create")}>
      <Plus className="h-4 w-4 mr-2" />
      Tạo vai trò mới
    </Button>
  )
}
