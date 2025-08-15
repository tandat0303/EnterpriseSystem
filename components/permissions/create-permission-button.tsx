"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreatePermissionButton() {
    const router = useRouter()
    return (
    <Button onClick={() => router.push("/permissions/create")}>
      <Plus className="h-4 w-4 mr-2" />
      Tạo quyền mới
    </Button>
  )
}