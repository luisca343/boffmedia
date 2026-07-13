"use client"

import { cn } from "@/lib/utils"

export interface ArSwitchProps {
  on: boolean
  onToggle: () => void
  label: string
  disabled?: boolean
}

export function Switch({ on, onToggle, label, disabled }: ArSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "ar-lift relative h-6 w-11 rounded-full border border-white/[.12] disabled:opacity-45",
        on
          ? "bg-[linear-gradient(180deg,rgb(var(--ar-cyan)),#008faa)] shadow-[0_0_14px_rgb(var(--ar-cyan)/.45)]"
          : "bg-white/[.08]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/.4)] transition-[left] duration-150",
          on ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  )
}
