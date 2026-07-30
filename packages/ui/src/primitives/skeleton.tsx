import * as React from "react"
import { cn } from "../cn"

export interface SkeletonProps {
  w?: number | string
  h?: number | string
  avatar?: boolean
  circle?: boolean
  style?: React.CSSProperties
  className?: string
}

export function Skeleton({ w = "100%", h, avatar, circle, style, className }: SkeletonProps) {
  const av = avatar || circle
  const hh = h != null ? h : av ? w : 14
  return (
    <span
      aria-hidden="true"
      style={{ width: w, height: hh, ...style }}
      className={cn(
        "block flex-none border border-solid border-line",
        "[background:linear-gradient(100deg,var(--panel)_30%,var(--panel-2)_50%,var(--panel)_70%)] [background-size:220%_100%]",
        "animate-[bm-shimmer_1.2s_linear_infinite] motion-reduce:animate-none",
        av && "border-0 cut-seal [--cut:8px]",
        className,
      )}
    />
  )
}
