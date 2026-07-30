import * as React from "react"
import { cn } from "../cn"

export interface PhProps {
  label?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

// Striped image/media placeholder (.sn-ph).
export function Ph({ label, style, className }: PhProps) {
  return (
    <div
      style={style}
      className={cn(
        "relative grid place-items-center min-h-[120px]",
        "[background:repeating-linear-gradient(-45deg,var(--stripe)_0_10px,transparent_10px_20px)]",
        "outline outline-1 outline-dashed outline-line-2 -outline-offset-[6px]",
        className,
      )}
    >
      <span className="font-mono text-[12px] font-medium leading-[1.5] text-txt-muted text-center px-[14px]">{label}</span>
    </div>
  )
}
