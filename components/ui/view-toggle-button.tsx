import { Button } from "@/components/ui/button"
import { Grid, List } from "lucide-react"
import { useState } from "react"

interface ViewToggleButtonProps {
  viewMode: "grid" | "list"
  onViewChange: (mode: "grid" | "list") => void
}

export function ViewToggleButton({ viewMode, onViewChange }: ViewToggleButtonProps) {
  return (
    <Button
      variant="outline"
      className="flex items-center space-x-2 border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
      onClick={() => onViewChange(viewMode === "grid" ? "list" : "grid")}
    >
      {viewMode === "grid" ? (
        <>
          <List className="h-4 w-4" />
          <span>Danh sách</span>
        </>
      ) : (
        <>
          <Grid className="h-4 w-4" />
          <span>Lưới</span>
        </>
      )}
    </Button>
  )
}