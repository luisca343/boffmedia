"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"

export interface SrtNumberStepperProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  size?: "sm" | "md"
  lessLabel?: string
  moreLabel?: string
  accent?: boolean
}

export function SrtNumberStepper({ value, onChange, min = 1, max = 99, size = "md", lessLabel, moreLabel, accent }: SrtNumberStepperProps) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)))
  const sizeClass = size === "sm" ? "h-[1.625rem]" : "h-[1.875rem]"
  const btnSize = size === "sm" ? "w-[1.375rem]" : "w-[1.625rem]"
  const iconSize = size === "sm" ? 13 : 15
  const textClass = size === "sm" ? "text-[0.6875rem]" : "text-[0.75rem]"
  const minWidthClass = size === "sm" ? "min-w-[1.375rem]" : "min-w-[1.625rem]"

  return (
    <div className={`inline-flex items-center border border-line-2 bg-panel-2 ${sizeClass}`}>
      <button
        type="button"
        aria-label={lessLabel ?? "Less"}
        disabled={value <= min}
        onClick={() => set(value - 1)}
        className={`grid ${btnSize} h-full place-items-center text-txt-muted transition-colors enabled:hover:bg-accent-soft enabled:hover:text-accent disabled:opacity-35`}
      >
        <Icon name="minus" size={iconSize} />
      </button>
      <span className={`grid h-full ${minWidthClass} place-items-center border-x border-line-2 text-center font-mono ${textClass} font-bold tabular-nums ${accent ? "text-accent" : "text-txt"}`}>
        {value}
      </span>
      <button
        type="button"
        aria-label={moreLabel ?? "More"}
        disabled={value >= max}
        onClick={() => set(value + 1)}
        className={`grid ${btnSize} h-full place-items-center text-txt-muted transition-colors enabled:hover:bg-accent-soft enabled:hover:text-accent disabled:opacity-35`}
      >
        <Icon name="plus" size={iconSize} />
      </button>
    </div>
  )
}
