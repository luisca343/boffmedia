"use client"

import * as React from "react"

interface MetricProps {
  value: React.ReactNode
  label: React.ReactNode
  size?: "sm" | "md" | "lg"
  tone?: "text" | "orange" | "accent"
  mono?: boolean
  boxed?: boolean
  className?: string
}

export function Metric({ value, label, size = "md", tone = "text", mono = false, boxed = false, className = "" }: MetricProps) {
  const valueSize = size === "sm" ? "var(--t-xl)" : size === "lg" ? "var(--t-3xl)" : "var(--t-2xl)"
  const valueWeight = size === "lg" ? 900 : 800
  const valueColor = tone === "orange" ? "var(--orange-500)" : tone === "accent" ? "var(--secondary-hover)" : "var(--text)"
  const cls = ["flex flex-col gap-[0.2rem] min-w-0", boxed ? "p-[1.1rem_1.2rem] rounded-[var(--radius-lg)] border border-edge bg-[var(--card-bg)]" : "", className].join(" ").trim()

  return (
    <div className={cls}>
      <span
        className="font-display leading-[1.05] whitespace-nowrap"
        style={{ fontSize: valueSize, fontWeight: valueWeight, color: valueColor }}
      >
        {value}
      </span>
      <span
        className={mono ? "font-mono text-xs tracking-[0.1em] uppercase text-ink-dim mt-1" : "text-sm text-ink-dim"}
      >
        {label}
      </span>
    </div>
  )
}
