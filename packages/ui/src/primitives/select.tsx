import * as React from "react"
import { cn } from "../cn"
import { INPUT_BASE, INPUT_SM } from "./input"
import { Field } from "./field"

// CSS-drawn caret (two 45°/135° gradients), matching .sn-select in components.css.
// Handed to the chassis as --ctl-bg layers rather than set as `background-image`:
// a native <select> cannot render ::after, so `.cut-tag-edge` paints its corner
// stroke as a background layer on form controls, and a direct `background-image`
// here would replace it (see the geometry plugin in @boffmedia/tailwind-config).
const CARET_STYLE = {
  appearance: "none",
  "--ctl-bg":
    "linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%)",
  "--ctl-bg-pos": "calc(100% - 18px) 55%, calc(100% - 13px) 55%",
  "--ctl-bg-size": "5px 5px, 5px 5px",
} as React.CSSProperties

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
  /** `sm` is the 32px control scale shared with Input and Button. */
  size?: "sm" | "md"
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
  size,
  className,
}: SelectProps) {
  const sel = (
    <select
      className={cn(INPUT_BASE, size === "sm" ? cn(INPUT_SM, "pr-8") : "pr-9", className)}
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
