import React from "react"

export interface PostItProps {
  children?: React.ReactNode
  color?: string
  tilt?: number
  size?: number
  footer?: string
}

export function PostIt({
  children,
  color = "#fff77a",
  tilt = -3,
  size = 130,
  footer = "",
}: PostItProps) {
  return (
    <div
      style={{
        width: size,
        minHeight: size * 0.9,
        padding: "16px 14px 12px 14px",
        background: `linear-gradient(180deg, ${color}, ${color}cc)`,
        transform: `rotate(${tilt}deg)`,
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.1), 4px 8px 12px rgba(0,0,0,0.35), 12px 16px 24px -8px rgba(0,0,0,0.3)",
        position: "relative",
        fontFamily: "'Patrick Hand', 'Caveat', cursive",
        fontSize: 14,
        color: "#3a2a18",
        lineHeight: 1.3,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -8,
          left: "50%",
          transform: "translateX(-50%) rotate(-3deg)",
          width: 50,
          height: 16,
          background: "rgba(220,200,160,0.55)",
          border: "1px solid rgba(180,150,100,0.3)",
          boxShadow: "0 2px 3px rgba(0,0,0,0.2)",
        }}
      />
      {children}
      {footer && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            opacity: 0.55,
            textAlign: "right",
            borderTop: "1px solid rgba(60,40,20,0.2)",
            paddingTop: 4,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  )
}
