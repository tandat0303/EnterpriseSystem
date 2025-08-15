"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface AccountCreatedNotificationProps {
  userName: string
}

export function AccountCreatedNotification({ userName }: AccountCreatedNotificationProps) {
  const { toast } = useToast()

  useEffect(() => {
    toast({
      title: "Tạo tài khoản thành công",
      description: `Tài khoản "${userName}" đã được tạo và sẵn sàng sử dụng.`,
    })
  }, [userName, toast])

  return null
}
