"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffSwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  onCheckedChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function BoffSwitch({ checked, defaultChecked = false, onChange, onCheckedChange, label, disabled, className, id }: BoffSwitchProps) {
  const [on, setOn] = React.useState(defaultChecked)
  const val = checked != null ? checked : on
  const handleChange = onChange || onCheckedChange
  const toggle = () => { if (disabled) return; if (checked == null) setOn(!val); handleChange && handleChange(!val) }

  return (
    <button id={id} className={cn("switch", val && "switch--on", disabled && "opacity-50 cursor-not-allowed", className)}
      role="switch" aria-checked={val} onClick={toggle} disabled={disabled}>
      <span className="switch__track"><span className="switch__thumb" /></span>
      {label && <span className="switch__label">{label}</span>}
    </button>
  )
}
