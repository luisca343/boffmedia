import React from "react"

export interface ShieldProps {
  size?: number
  color?: string
  children?: React.ReactNode
}

export function Shield({ size = 48, color = "var(--gold-2)", children }: ShieldProps) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size * 1.18,
        display: "inline-block",
      }}
    >
      <svg
        viewBox="0 0 100 118"
        width={size}
        height={size * 1.18}
        style={{
          position: "absolute",
          inset: 0,
          filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.5))",
        }}
      >
        <defs>
          <linearGradient id="sh-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="30%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </linearGradient>
        </defs>
        <path
          d="M 8 4 L 92 4 L 92 56 Q 92 100 50 114 Q 8 100 8 56 Z"
          fill="url(#sh-g)"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="1.5"
        />
        <path d="M 8 4 L 92 4 L 92 12 L 8 12 Z" fill="rgba(0,0,0,0.32)" />
        <path
          d="M 16 14 L 84 14 L 84 56 Q 84 92 50 106 Q 16 92 16 56 Z"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.8"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1e120a",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: size * 0.42,
          paddingTop: size * 0.12,
        }}
      >
        {children}
      </div>
    </div>
  )
}
