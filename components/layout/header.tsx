"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User, Search } from "lucide-react"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { SearchForm } from "@/components/layout/search-form"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-gradient-to-r from-blue-50 to-white px-3 sm:px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4">
        <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-blue-800 truncate">
          Enterprise System
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors duration-200"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Toggle search</span>
          </Button>
          {isSearchOpen && (
            <div className="absolute top-12 right-0 z-50 w-56 sm:w-64">
              <SearchForm className="bg-white shadow-md rounded-md border border-blue-200" />
            </div>
          )}
        </div>
        <NotificationsDropdown />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                <AvatarFallback className="text-xs sm:text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border-blue-200 w-56">
            <DropdownMenuLabel className="text-blue-800">
              <div className="truncate">{user?.name || "Người dùng"}</div>
              <div className="text-xs text-blue-600 truncate">{user?.email || "N/A"}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-blue-200" />
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-blue-700 hover:bg-blue-50 hover:text-blue-900"
            >
              <Settings className="mr-2 h-4 w-4" />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/users/${user?._id}`)}
              className="text-blue-700 hover:bg-blue-50 hover:text-blue-900"
            >
              <User className="mr-2 h-4 w-4" />
              Hồ sơ
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-blue-200" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 hover:text-red-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}