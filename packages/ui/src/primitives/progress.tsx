import * as React from "react"
import { cn } from "../cn"

export interface ProgressProps {
  value: number
  className?: string
  "aria-label"?: string
}

export function Progress({ value, className, "aria-label": ariaLabel }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={ariaLabel}
      className={cn("relative h-2 overflow-hidden bg-panel-2 border border-solid border-line", className)}
    >
      <i
        style={{ ["--p" as string]: clamped + "%" }}
        className={cn(
          "absolute inset-0 w-[var(--p,50%)] transition-[width] duration-[600ms]",
          "[background:repeating-linear-gradient(-55deg,var(--accent)_0_8px,var(--accent-bright)_8px_16px)]",
        )}
      />
    </div>
  )
}
