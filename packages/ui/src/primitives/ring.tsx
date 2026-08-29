import * as React from "react"
import { cn } from "../cn"

export interface RingProps {
  value: number
  size?: number
  thickness?: number
  children?: React.ReactNode
  className?: string
  "aria-label"?: string
}

// Radial progress ring (logros, colecciones). Accent arc over a steel track.
export function Ring({ value, size = 92, thickness = 8, children, className, "aria-label": ariaLabel }: RingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const deg = clamped * 3.6
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={ariaLabel}
      className={cn("relative grid place-items-center flex-none", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(var(--accent) ${deg}deg, var(--panel-2) 0)` }}
      />
      <div className="absolute rounded-full bg-panel border border-solid border-line" style={{ inset: thickness }} />
      <span className="relative font-mono font-semibold text-txt" style={{ fontSize: Math.round(size * 0.2) }}>
        {children}
      </span>
    </div>
  )
}
