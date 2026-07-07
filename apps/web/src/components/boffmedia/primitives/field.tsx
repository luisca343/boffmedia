import * as React from "react"
import { cn } from "@/lib/utils"

export interface FieldProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        error && "[&_input]:border-bad [&_textarea]:border-bad [&_select]:border-bad",
        className,
      )}
    >
      {label && (
        <label className="font-mono text-[11px] font-semibold leading-none uppercase tracking-[0.12em] text-txt-muted">
          {label}
        </label>
      )}
      {children}
      {(hint || error) && (
        <span className={cn("font-body text-[12px] leading-[1.4]", error ? "text-bad" : "text-txt-dim")}>
          {error || hint}
        </span>
      )}
    </div>
  )
}
