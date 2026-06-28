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
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", disabled && "opacity-50 cursor-not-allowed", className)} htmlFor={id}>
      <button
        type="button"
        role="checkbox"
        aria-checked={val}
        id={id}
        className={cn(
          "grid place-items-center w-5 h-5 rounded-md p-0",
          "border-[1.5px] border-solid border-edge-strong",
          "bg-layer-2 text-white",
          "cursor-pointer",
          "transition-[background,border-color] duration-[var(--dur,0.32s)]",
          "data-[direction=hud]:rounded-[3px]",
          val && "bg-secondary border-secondary text-[var(--on-secondary)]",
        )}
        disabled={disabled}
        onClick={toggle}
      >
        {val && <Icon name="check" size={13} stroke={3} />}
      </button>
      {label && <span className="text-sm font-medium">{label}</span>}
    </label>
  )
}
