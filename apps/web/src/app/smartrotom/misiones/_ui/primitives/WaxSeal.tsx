import { useMemo } from "react"
import React from "react"

function ridgedPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  points = 28,
): string {
  let d = ""
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " "
  }
  return d + "Z"
}

const WAX_RIDGE_PATH = ridgedPath(50, 50, 46, 41, 32)

export interface WaxSealProps {
  glyph?: string
  color?: string
  size?: number
  tilt?: number
  className?: string
}

export function WaxSeal({
  glyph = "Q",
  color = "var(--seal-available)",
  size = 60,
  tilt = -8,
  className = "",
}: WaxSealProps) {
  const id = useMemo(() => "wax_" + Math.random().toString(36).slice(2, 8), [])
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{
        transform: `rotate(${tilt}deg)`,
        filter: "drop-shadow(2px 4px 4px rgba(0,0,0,0.5))",
        flexShrink: 0,
      }}
    >
      <defs>
        <radialGradient id={id + "wax"} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="20%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={id + "in"} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="60%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.40" />
        </radialGradient>
      </defs>
      <path d={WAX_RIDGE_PATH} fill={color} />
      <circle cx="50" cy="50" r="36" fill={color} />
      <circle
        cx="50"
        cy="50"
        r="36"
        fill={`url(#${id}wax)`}
        style={{ mixBlendMode: "multiply" }}
      />
      <circle cx="50" cy="50" r="36" fill={`url(#${id}in)`} />
      <circle
        cx="50"
        cy="50"
        r="29"
        fill="none"
        stroke="rgba(0,0,0,0.32)"
        strokeWidth="1.2"
      />
      <circle
        cx="50"
        cy="50"
        r="29"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.6"
      />
      <ellipse
        cx="38"
        cy="32"
        rx="14"
        ry="6"
        fill="rgba(255,255,255,0.28)"
        transform="rotate(-25 38 32)"
      />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="Cinzel Decorative, Cinzel, serif"
        fontSize="30"
        fontWeight="700"
        fill="rgba(0,0,0,0.55)"
        style={{ paintOrder: "stroke" } as React.CSSProperties}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="0.6"
      >
        {glyph}
      </text>
    </svg>
  )
}
