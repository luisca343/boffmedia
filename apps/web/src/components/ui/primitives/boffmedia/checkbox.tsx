"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface BoffCheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  disabled?: boolean
  label?: string
  id?: string
  className?: string
}

export function BoffCheckbox({ checked, defaultChecked = false, onChange, onCheckedChange, disabled, label, id, className }: BoffCheckboxProps) {
  const [on, setOn] = React.useState(defaultChecked)
  const val = checked != null ? checked : on
  const toggle = () => { if (disabled) return; const n = !val; if (checked == null) setOn(n); onChange && onChange(n); onCheckedChange && onCheckedChange(n) }

  return (
    <label className={cn("k-cbrow", disabled && "k-cbrow--dis", className)} htmlFor={id}>
      <button type="button" role="checkbox" aria-checked={val} id={id} className="k-cb" data-on={val ? "" : undefined} disabled={disabled} onClick={toggle}>
        {val && <Icon name="check" size={13} stroke={3} />}
      </button>
      {label && <span className="k-cbrow__label">{label}</span>}
    </label>
  )
}
