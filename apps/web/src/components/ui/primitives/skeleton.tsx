import { cn } from "@/lib/utils"
import * as React from "react"

type SkeletonVariant = "default" | "wingull"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    default: "bg-surface-800",
    wingull: "bg-secondary-800/50"
  }

  return (
    <div
      className={cn("animate-pulse rounded-md", variantStyles[variant], className)}
      {...props}
    />
  )
}

export { Skeleton }
export type { SkeletonVariant }