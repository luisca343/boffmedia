"use client"

import { cn } from "@/lib/utils"

interface BoffSkeletonProps {
  w?: string | number
  h?: string | number
  circle?: boolean
  radius?: string | number
  className?: string
  style?: React.CSSProperties
}

export function BoffSkeleton({ w, h, circle, radius, className, style }: BoffSkeletonProps) {
  const hasExplicitSize = w !== undefined || h !== undefined
  const defaultW = w ?? "100%"
  const defaultH = h ?? 14
  return (
    <span
      className={cn(
        "block",
        "bg-[linear-gradient(90deg,var(--surface-2)_0%,var(--surface-3)_50%,var(--surface-2)_100%)]",
        "bg-[length:200%_100%]",
        "animate-k-shimmer",
        !hasExplicitSize && "w-full h-3.5",
        className,
      )}
      style={hasExplicitSize ? {
        width: circle ? defaultH : defaultW,
        height: defaultH,
        borderRadius: circle ? "50%" : radius != null ? radius : "var(--radius, 14px)",
        ...style,
      } : style}
    />
  )
}
