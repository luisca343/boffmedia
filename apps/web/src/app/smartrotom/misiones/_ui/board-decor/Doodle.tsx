import React from "react"

export type DoodleKind = "arrow" | "star" | "check" | "skull"

export interface DoodleProps {
  tilt?: number
  size?: number
  kind?: DoodleKind
}

export function Doodle({ tilt = 0, size = 110, kind = "arrow" }: DoodleProps) {
  const doodles: Record<DoodleKind, React.ReactNode> = {
    arrow: (
      <svg viewBox="0 0 100 60" width={size} height={size * 0.6}>
        <path
          d="M 8 30 C 20 6, 60 6, 86 28 L 78 22 M 86 28 L 78 36"
          fill="none"
          stroke="#2a1810"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <path
          d="M 30 6 L 36 24 L 54 24 L 40 35 L 46 53 L 30 42 L 14 53 L 20 35 L 6 24 L 24 24 Z"
          fill="none"
          stroke="#2a1810"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <path
          d="M 8 32 L 22 48 L 52 12"
          fill="none"
          stroke="#6b1410"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    skull: (
      <svg viewBox="0 0 60 60" width={size * 0.6} height={size * 0.6}>
        <circle cx="30" cy="26" r="16" fill="none" stroke="#2a1810" strokeWidth="2" />
        <circle cx="24" cy="26" r="3" fill="#2a1810" />
        <circle cx="36" cy="26" r="3" fill="#2a1810" />
        <path
          d="M 22 42 L 24 50 M 28 42 L 28 50 M 32 42 L 32 50 M 36 42 L 38 50"
          stroke="#2a1810"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  }
  return (
    <div style={{ transform: `rotate(${tilt}deg)`, display: "inline-block" }}>
      {doodles[kind]}
    </div>
  )
}
