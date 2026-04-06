import * as React from "react"
import { cn } from "@/lib/utils"

const LINE_VARIANT_MAP = {
  default: "bg-surface-700",
  subtle: "bg-surface-800",
  accent: "bg-gradient-to-r from-transparent via-primary-500/40 to-transparent",
} as const

export interface DividerProps {
  orientation?: "horizontal" | "vertical"
  label?: React.ReactNode
  labelPosition?: "left" | "center" | "right"
  variant?: keyof typeof LINE_VARIANT_MAP
  className?: string
}

function Divider({
  orientation = "horizontal",
  label,
  labelPosition = "center",
  variant = "default",
  className,
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div className={cn("w-px self-stretch", LINE_VARIANT_MAP[variant], className)} />
    )
  }

  if (!label) {
    return <div className={cn("h-px w-full", LINE_VARIANT_MAP[variant], className)} />
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {labelPosition !== "left" && (
        <div className={cn("h-px flex-1", LINE_VARIANT_MAP[variant])} />
      )}
      <div className="flex-shrink-0">{label}</div>
      {labelPosition !== "right" && (
        <div className={cn("h-px flex-1", LINE_VARIANT_MAP[variant])} />
      )}
    </div>
  )
}
Divider.displayName = "Divider"

export { Divider }
