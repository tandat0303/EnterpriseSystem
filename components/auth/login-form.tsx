"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ButtonLoading } from "@/components/ui/loading"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!email) {
      newErrors.email = "Email không được để trống."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ."
    }
    if (!password) {
      newErrors.password = "Mật khẩu không được để trống."
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    const success = await login(email, password)
    if (success) {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-white px-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-gray-50 to-white shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-800">Đăng nhập</CardTitle>
          <CardDescription className="text-gray-600">Nhập thông tin đăng nhập của bạn để truy cập hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: "" }))
                }}
                disabled={isLoading}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: "" }))
                }}
                disabled={isLoading}
                className="border-blue-200 focus:ring-blue-500"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200" disabled={isLoading}>
              <ButtonLoading isLoading={isLoading} loadingText="Đang đăng nhập...">
                Đăng nhập
              </ButtonLoading>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}