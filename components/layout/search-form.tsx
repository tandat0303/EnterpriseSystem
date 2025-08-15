"use client"

import type React from "react"
import { Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function SearchForm({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form className={`relative ${className}`} {...props}>
      <Label htmlFor="search" className="sr-only">
        Search
      </Label>
      <Input
        id="search"
        placeholder="Search the docs..."
        className="pl-8 pr-4 py-2 w-full"
      />
      <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
    </form>
  )
}