import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import type React from "react"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ size = "md", className, ...props }: LoadingSpinnerProps) {
  const spinnerSize = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }
  return <Loader2 className={cn("animate-spin text-gray-500", spinnerSize[size], className)} {...props} />
}

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
}

export function LoadingSkeleton({ lines = 1, className, ...props }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  )
}

interface LoadingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function LoadingCard({ children, className, ...props }: LoadingCardProps) {
  return (
    <div
      className={cn("rounded-xl border bg-card text-card-foreground shadow p-6 animate-pulse", className)}
      {...props}
    >
      {children || (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      )}
    </div>
  )
}

interface ButtonLoadingProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function ButtonLoading({ isLoading, loadingText, children }: ButtonLoadingProps) {
  return (
    <>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </>
      ) : (
        children
      )}
    </>
  )
}
