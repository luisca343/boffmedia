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
    <button
      id={id}
      className={cn(
        "inline-flex items-center gap-2",
        "border-0 bg-transparent cursor-pointer font-body p-0",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      role="switch"
      aria-checked={val}
      onClick={toggle}
      disabled={disabled}
    >
      <span
        className={cn(
          "w-[42px] h-6 rounded-[999px]",
          "bg-layer-3",
          "border border-solid border-edge-strong",
          "relative",
          "transition-background duration-[var(--dur,0.32s)]",
          val && "bg-secondary border-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full",
            "bg-[var(--text-muted)]",
            "transition-[transform,background] duration-[var(--dur,0.32s)] ease-[var(--ease)]",
            val && "translate-x-[18px] bg-white",
          )}
        />
      </span>
      {label && <span className="text-sm font-semibold">{label}</span>}
    </button>
  )
}
