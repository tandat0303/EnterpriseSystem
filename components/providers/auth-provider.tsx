"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { User as UserType } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: UserType | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    const storedToken = localStorage.getItem("authToken")
    if (storedUser && storedToken) {
      try {
        const parsedUser: UserType = JSON.parse(storedUser)

        if (parsedUser && storedToken) {
          parsedUser.createdAt = new Date(parsedUser.createdAt)
          parsedUser.updatedAt = new Date(parsedUser.updatedAt)
          if (parsedUser.lastLogin) parsedUser.lastLogin = new Date(parsedUser.lastLogin)

          if (typeof parsedUser._id !== "string") {
            parsedUser._id = parsedUser._id.toString()
          }

          parsedUser.permissions = parsedUser.permissions || []

          setUser(parsedUser)
          setToken(storedToken)
        }
      } catch (e) {
        console.error("Failed to parse user or token:", e)
        localStorage.removeItem("currentUser")
        localStorage.removeItem("authToken")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (response.ok) {
          const loggedInUser: UserType = {
            ...data.user,
            _id: data.user._id.toString(),
            id: data.user._id.toString(),
            createdAt: new Date(data.user.createdAt),
            updatedAt: new Date(data.user.updatedAt),
            lastLogin: data.user.lastLogin ? new Date(data.user.lastLogin) : undefined,
            permissions: data.user.permissions || [],
            departmentId: data.user.departmentId || undefined,
          }

          setUser(loggedInUser)
          setToken(data.token)
          localStorage.setItem("currentUser", JSON.stringify(loggedInUser))
          localStorage.setItem("authToken", data.token)
          toast({
            title: "Đăng nhập thành công",
            description: `Chào mừng, ${loggedInUser.name}!`,
          })
          return true
        } else {
          toast({
            title: "Đăng nhập thất bại",
            description: data.error || "Email hoặc mật khẩu không đúng.",
            variant: "destructive",
          })
          return false
        }
      } catch (error) {
        console.error("Login API call failed:", error)
        toast({
          title: "Lỗi hệ thống",
          description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
          variant: "destructive",
        })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("currentUser")
    localStorage.removeItem("authToken")
    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi hệ thống.",
    })
  }, [toast])

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}