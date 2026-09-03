"use client"

import { cn } from "@boffmedia/ui/cn"
import { Icon } from "@boffmedia/ui"

export interface NumberStepperProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  error?: boolean
  ariaLabel?: string
}

// compact numeric stepper with clamped bounds.
export function NumberStepper({ value, onChange, min = 0, max = 999, step = 1, error, ariaLabel }: NumberStepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const set = (v: number) => onChange(clamp(Number.isNaN(v) ? min : v))
  const btn =
    "grid w-6 place-items-center text-txt-dim transition-[color,background] duration-[140ms] hover:bg-panel-2 hover:text-accent-bright"
  return (
    <span
      className={cn(
        "inline-flex items-stretch border border-solid border-line-2 bg-base [[data-theme=light]_&]:bg-panel-2 focus-within:border-accent",
        error && "border-bad",
      )}
    >
      <button type="button" tabIndex={-1} aria-label="−" onClick={() => set((value || 0) - step)} className={btn}>
        <Icon name="minus" size={12} />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        onChange={(e) => set(parseInt(e.target.value, 10))}
        className="w-[3.25rem] border-0 bg-transparent px-0.5 py-[0.4375rem] text-center font-mono text-[0.75rem]/none text-txt outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" tabIndex={-1} aria-label="+" onClick={() => set((value || 0) + step)} className={btn}>
        <Icon name="plus" size={12} />
      </button>
    </span>
  )
}
