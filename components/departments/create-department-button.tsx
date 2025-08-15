"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateDepartmentButton() {
  const router = useRouter()
  return (
    <Button onClick={() => router.push("/departments/create")}>
      <Plus className="h-4 w-4 mr-2" />
      Tạo phòng ban mới
    </Button>
  )
}
