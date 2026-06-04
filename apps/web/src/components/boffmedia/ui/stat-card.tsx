"use client"

import * as React from "react"
import { Icon } from "../primitives/icon"

interface StatCardProps {
  icon: string
  value: string
  label: string
  sub?: string
}

export function StatCard({ icon, value, label, sub }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-[0.15rem] p-[1.1rem] rounded-[var(--radius)] bg-[var(--surface-2)]"
      style={{ border: "var(--hairline) solid var(--border)" }}
    >
      <span
        className="w-9 h-9 rounded-[var(--radius)] grid place-items-center mb-2"
        style={{
          color: "var(--orange-500)",
          background: "color-mix(in srgb, var(--orange-500) 12%, transparent)",
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="font-display font-extrabold text-[length:var(--t-2xl)] whitespace-nowrap leading-none">{value}</span>
      <span className="text-sm font-semibold mt-[0.1rem]">{label}</span>
      {sub && <span className="text-xs text-[var(--text-dim)] mt-[0.05rem]">{sub}</span>}
    </div>
  )
}
