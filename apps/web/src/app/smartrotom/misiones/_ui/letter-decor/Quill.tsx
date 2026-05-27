import React from "react"

export interface QuillProps {
  size?: number
  tilt?: number
}

export function Quill({ size = 140, tilt = 18 }: QuillProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{
        transform: `rotate(${tilt}deg)`,
        filter: "drop-shadow(2px 4px 5px rgba(0,0,0,0.5))",
      }}
    >
      <defs>
        <linearGradient id="feather-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5e8b8" />
          <stop offset="45%" stopColor="#c89a4a" />
          <stop offset="100%" stopColor="#5a3a18" />
        </linearGradient>
      </defs>
      <path
        d="M 30 170 Q 60 110 100 60 Q 140 20 170 20 Q 168 50 140 80 Q 100 120 60 160 Q 50 168 30 170 Z"
        fill="url(#feather-g)"
        stroke="#3a2410"
        strokeWidth="1.5"
      />
      <path
        d="M 30 170 Q 80 110 165 25"
        fill="none"
        stroke="#3a2410"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {Array.from({ length: 14 }).map((_, i) => {
        const t = i / 14
        const x1 = 30 + (165 - 30) * t
        const y1 = 170 + (25 - 170) * t
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x1 + (-22 + i * 1.4)}
            y2={y1 + (-28 + i * 0.4)}
            stroke="#3a2410"
            strokeWidth="0.6"
            opacity="0.5"
          />
        )
      })}
      <path
        d="M 20 180 L 30 168 L 38 178 L 28 188 Z"
        fill="#1a0e07"
        stroke="#000"
        strokeWidth="0.8"
      />
      <path d="M 24 184 L 30 178" stroke="#6b1410" strokeWidth="1.5" />
    </svg>
  )
}
