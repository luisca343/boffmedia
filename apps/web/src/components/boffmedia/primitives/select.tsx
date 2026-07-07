import * as React from "react"
import { cn } from "@/lib/utils"
import { INPUT_BASE } from "./input"
import { Field } from "./field"

// CSS-drawn caret (two 45°/135° gradients), matching .sn-select in components.css.
const CARET_STYLE: React.CSSProperties = {
  appearance: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 18px) 55%, calc(100% - 13px) 55%",
  backgroundSize: "5px 5px",
  backgroundRepeat: "no-repeat",
}

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  value?: string
  options?: (SelectOption | string)[]
  onChange?: (value: string) => void
  disabled?: boolean
  ariaLabel?: string
  id?: string
  className?: string
}

export function Select({
  label,
  hint,
  error,
  value,
  options = [],
  onChange,
  disabled,
  ariaLabel,
  id,
  className,
}: SelectProps) {
  const sel = (
    <select
      className={cn(INPUT_BASE, "pr-9", className)}
      style={CARET_STYLE}
      value={value}
      disabled={disabled}
      id={id}
      aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
      aria-invalid={error ? true : undefined}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o
        const l = typeof o === "object" ? o.label : o
        return (
          <option key={v} value={v}>
            {l}
          </option>
        )
      })}
    </select>
  )
  if (!label && !hint && !error) return sel
  return (
    <Field label={label} hint={hint} error={error}>
      {sel}
    </Field>
  )
}
