"use client"

import { useId } from "react"
import type { SealStatus } from "../../_types"
import { SEAL_FILL, STATUS_GLYPH, STATUS_LABEL } from "../../_utils/status"

/** A ridged disc of wax — 32 cusps, struck once at module load. */
function ridgedPath(cx: number, cy: number, outer: number, inner: number, points = 32) {
  let d = ""
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)} `
  }
  return `${d}Z`
}
const RIDGE = ridgedPath(50, 50, 46, 41)

interface WaxSealProps {
  /** The letter struck into the wax. Defaults to the status's own glyph. */
  glyph?: string
  color?: string
  size?: number
  tilt?: number
  /** Colour + glyph + accessible name, all from one status. */
  status?: SealStatus
  className?: string
}

/**
 * The seal that closes every paper on the board. Its colour is the quest's
 * status, applied as an SVG fill (a data-driven value — §4 — never a
 * `bg-ms-seal-${status}` class the JIT would silently drop).
 */
export function WaxSeal({ glyph, color, size = 60, tilt = -8, status, className }: WaxSealProps) {
  const id = useId().replace(/:/g, "")
  const fill = color ?? (status ? SEAL_FILL[status] : "rgb(var(--ms-seal-available))")
  const letter = glyph ?? (status ? STATUS_GLYPH[status] : "?")

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={status ? "img" : "presentation"}
      aria-label={status ? STATUS_LABEL[status] : undefined}
      aria-hidden={status ? undefined : true}
      style={{ transform: `rotate(${tilt}deg)`, filter: "drop-shadow(2px 4px 4px rgba(0,0,0,.5))" }}
    >
      <defs>
        <radialGradient id={`${id}wax`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="20%" stopColor={fill} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={`${id}in`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="60%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.40" />
        </radialGradient>
      </defs>
      <path d={RIDGE} fill={fill} />
      <circle cx="50" cy="50" r="36" fill={fill} />
      <circle cx="50" cy="50" r="36" fill={`url(#${id}wax)`} style={{ mixBlendMode: "multiply" }} />
      <circle cx="50" cy="50" r="36" fill={`url(#${id}in)`} />
      <circle cx="50" cy="50" r="29" fill="none" stroke="rgba(0,0,0,.32)" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="29" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="0.6" />
      <ellipse cx="38" cy="32" rx="14" ry="6" fill="rgba(255,255,255,.28)" transform="rotate(-25 38 32)" />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="Cinzel Decorative, Cinzel, serif"
        fontSize="30"
        fontWeight="700"
        fill="rgba(0,0,0,.55)"
        style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.5)", strokeWidth: 0.6 }}
      >
        {letter}
      </text>
    </svg>
  )
}
