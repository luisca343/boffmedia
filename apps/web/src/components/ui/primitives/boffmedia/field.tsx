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
    <label className={cn("field", className)} htmlFor={htmlFor}>
      {label && <span className="field-label">{icon && <Icon name={icon} size={15} />}{label}</span>}
      {children}
      {error ? <span className="field-msg field-msg--error"><Icon name="x" size={13} />{error}</span>
        : hint ? <span className="field-msg">{hint}</span> : null}
    </label>
  )
}
