"use client"

import { BOOST_NAMES } from "./bs-data"

interface BSBoostProps {
  stat: string
  value: number
}

export function BSBoost({ stat, value }: BSBoostProps) {
  if (!value) return null
  const isUp = value > 0
  return (
    <span
      className="font-mono font-bold text-t-3xs tracking-[.04em] px-[.42em] py-[.2em] rounded-[var(--radius-sm)] leading-none inline-flex gap-[.2em] border"
      style={
        isUp
          ? { color: "var(--emerald-400)", background: "color-mix(in srgb, var(--emerald-500) 16%, transparent)", borderColor: "color-mix(in srgb, var(--emerald-500) 40%, transparent)" }
          : { color: "var(--rose-400)", background: "color-mix(in srgb, var(--rose-500) 16%, transparent)", borderColor: "color-mix(in srgb, var(--rose-500) 40%, transparent)" }
      }
    >
      {isUp ? "+" : ""}{value} {BOOST_NAMES[stat] || stat}
    </span>
  )
}
