import * as React from "react"
import { cn } from "@/lib/utils"

export interface RingProps {
  value: number
  size?: number
  thickness?: number
  children?: React.ReactNode
  className?: string
}

// Radial progress ring (logros, colecciones). Accent arc over a steel track.
export function Ring({ value, size = 92, thickness = 8, children, className }: RingProps) {
  const deg = Math.max(0, Math.min(100, value)) * 3.6
  return (
    <div className={cn("relative grid place-items-center flex-none", className)} style={{ width: size, height: size }}>
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
