"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateWorkflowButton() {
  const router = useRouter()
  return (
    <Button onClick={() => router.push("/workflows/create")}>
      <Plus className="h-4 w-4 mr-2" />
      Tạo luồng phê duyệt mới
    </Button>
  )
}
