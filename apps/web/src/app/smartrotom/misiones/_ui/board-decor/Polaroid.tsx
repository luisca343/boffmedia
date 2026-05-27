import React from "react"

export interface PolaroidProps {
  caption?: string
  tilt?: number
  size?: number
  image?: React.ReactNode
}

export function Polaroid({
  caption = "Ruta 1",
  tilt = -4,
  size = 130,
  image,
}: PolaroidProps) {
  return (
    <div
      style={{
        width: size,
        padding: "10px 10px 22px 10px",
        background: "#f5efde",
        transform: `rotate(${tilt}deg)`,
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.06), 4px 8px 14px rgba(0,0,0,0.4), 12px 20px 28px -10px rgba(0,0,0,0.45)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -10,
          right: -10,
          width: 38,
          height: 22,
          background: "rgba(220,200,160,0.6)",
          border: "1px solid rgba(180,150,100,0.3)",
          transform: "rotate(28deg)",
        }}
      />
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 0.95",
          background: "linear-gradient(135deg, #4a5a2c 0%, #7a8a4a 40%, #c8b86a 90%)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)",
        }}
      >
        {image || (
          <svg viewBox="0 0 100 95" width="100%" height="100%">
            <rect x="0" y="60" width="100" height="35" fill="#5a4830" />
            <path
              d="M 0 60 L 30 35 L 50 50 L 80 25 L 100 45 L 100 60 Z"
              fill="#3a4a22"
            />
            <circle cx="78" cy="20" r="9" fill="#f5d785" opacity="0.85" />
            <path d="M 15 70 L 22 60 L 28 70 Z" fill="#2a1810" />
            <path d="M 60 76 L 68 64 L 74 76 Z" fill="#2a1810" />
          </svg>
        )}
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 8,
          fontFamily: "'Patrick Hand', 'Caveat', cursive",
          fontSize: 13,
          color: "#3a2a18",
        }}
      >
        {caption}
      </div>
    </div>
  )
}
