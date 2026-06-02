"use client"

import { cn } from "@/lib/utils"

interface BoffProgressProps {
  value?: number
  tone?: "accent" | "orange" | "emerald"
  label?: string
  className?: string
}

export function BoffProgress({ value = 0, tone = "accent", label, className }: BoffProgressProps) {
  return (
    <div className={cn("k-prog", className)}>
      {label && <div className="k-prog__top"><span>{label}</span><span className="k-prog__pct">{Math.round(value)}%</span></div>}
      <div className="k-prog__track"><div className={cn("k-prog__bar", `k-prog__bar--${tone}`)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
    </div>
  )
}

interface BoffRingProps {
  value?: number
  size?: number
  tone?: "orange" | "accent" | "emerald"
  className?: string
}

export function BoffRing({ value = 0, size = 64, tone = "orange", className }: BoffRingProps) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const color = tone === "accent" ? "var(--accent-bright)" : tone === "emerald" ? "var(--emerald-400)" : "var(--orange-500)"
  return (
    <span className={cn("k-ring", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <span className="k-ring__num">{Math.round(value)}</span>
    </span>
  )
}
