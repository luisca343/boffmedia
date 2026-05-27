import React from "react"

export interface RibbonProps {
  children: React.ReactNode
  color?: string
  width?: number
  height?: number
}

export function Ribbon({
  children,
  color,
  width = 320,
  height = 56,
}: RibbonProps) {
  const w = width
  const h = height
  const c = color || "var(--seal-available)"
  return (
    <div style={{ position: "relative", width: w, height: h, display: "inline-block" }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        style={{
          position: "absolute",
          inset: 0,
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
        }}
      >
        <defs>
          <linearGradient id="rib-g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.95" />
            <stop offset="50%" stopColor={c} stopOpacity="1" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </linearGradient>
        </defs>
        <path
          d={`M 14 8 L ${w - 14} 8 L ${w - 2} ${h / 2} L ${w - 14} ${h - 8} L 14 ${h - 8} L 2 ${h / 2} Z`}
          fill="url(#rib-g)"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="1"
        />
        <path
          d={`M 2 ${h / 2} L 14 8 L 18 ${h / 2} L 14 ${h - 8} Z`}
          fill="rgba(0,0,0,0.32)"
        />
        <path
          d={`M ${w - 2} ${h / 2} L ${w - 14} 8 L ${w - 18} ${h / 2} L ${w - 14} ${h - 8} Z`}
          fill="rgba(0,0,0,0.32)"
        />
        <path
          d={`M 16 12 L ${w - 16} 12`}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--paper-1)",
          fontFamily: "var(--font-display)",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
        }}
      >
        {children}
      </div>
    </div>
  )
}
