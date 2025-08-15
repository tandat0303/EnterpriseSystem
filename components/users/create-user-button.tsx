"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateUserButton() {
  const router = useRouter()
  return (
    <Button onClick={() => router.push("/users/create")}>
      <Plus className="h-4 w-4 mr-2" />
      Tạo người dùng mới
    </Button>
  )
}
