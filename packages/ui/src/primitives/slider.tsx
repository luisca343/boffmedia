"use client"

import * as React from "react"
import { cn } from "../cn"

export interface SliderProps {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  unit?: string
  label?: React.ReactNode
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  unit = "",
  label,
  disabled,
  ariaLabel,
  className,
}: SliderProps) {
  const [un, setUn] = React.useState(defaultValue != null ? defaultValue : min)
  const isCtrl = value !== undefined
  const val = isCtrl ? (value as number) : un
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-x-[0.875rem] gap-y-[0.625rem] w-full",
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
    >
      {label && (
        <span className="col-span-full font-mono text-[0.6875rem] font-semibold leading-none uppercase tracking-[0.12em] text-txt-muted">
          {label}
        </span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        disabled={disabled}
        aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
        style={{ ["--p" as string]: pct + "%" }}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (!isCtrl) setUn(v)
          onChange?.(v)
        }}
        className={cn(
          "appearance-none w-full h-2 m-0 cursor-pointer border border-solid border-line",
          "[background:linear-gradient(90deg,var(--accent)_var(--p,50%),var(--panel-2)_var(--p,50%))]",
          "focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-[3px]",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[1.125rem] [&::-webkit-slider-thumb]:h-[1.125rem]",
          "[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:transition-colors",
          "[&::-webkit-slider-thumb]:cut [--cut:4px]",
          "hover:[&::-webkit-slider-thumb]:bg-accent-bright",
          "[&::-moz-range-thumb]:w-[1.125rem] [&::-moz-range-thumb]:h-[1.125rem] [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-none",
        )}
      />
      <output className="font-mono text-[0.8125rem] font-semibold leading-none text-accent min-w-[2.875rem] text-right">
        {val}
        {unit}
      </output>
    </div>
  )
}
