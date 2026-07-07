import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn("relative h-2 overflow-hidden bg-panel-2 border border-solid border-line", className)}>
      <i
        style={{ ["--p" as string]: value + "%" }}
        className={cn(
          "absolute inset-0 w-[var(--p,50%)] transition-[width] duration-[600ms]",
          "[background:repeating-linear-gradient(-55deg,var(--accent)_0_8px,var(--accent-bright)_8px_16px)]",
        )}
      />
    </div>
  )
}
