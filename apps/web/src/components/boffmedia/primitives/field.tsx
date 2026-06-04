"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface FieldProps {
  label?: string
  icon?: string
  hint?: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}

export function Field({ label, icon, hint, error, htmlFor, children, className }: FieldProps) {
  return (
    <label className={cn("flex flex-col", className)} htmlFor={htmlFor}>
      {label && (
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] mb-2">
          {icon && <Icon name={icon} size={15} />}
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="text-xs text-rose-400 mt-1.5 inline-flex items-center gap-1.5">
          <Icon name="x" size={13} />{error}
        </span>
      ) : hint ? (
        <span className="text-xs text-[var(--text-dim)] mt-1.5 inline-flex items-center gap-1.5">{hint}</span>
      ) : null}
    </label>
  )
}
