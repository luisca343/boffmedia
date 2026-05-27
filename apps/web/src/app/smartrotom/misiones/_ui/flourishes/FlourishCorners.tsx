import React from "react"
import { Flourish } from "./Flourish"

export interface FlourishCornersProps {
  size?: number
  color?: string
  offset?: number
  opacity?: number
}

export function FlourishCorners({
  size = 36,
  color = "var(--ink-2)",
  offset = 6,
  opacity = 0.55,
}: FlourishCornersProps) {
  const wrap: React.CSSProperties = {
    position: "absolute",
    color,
    opacity,
    pointerEvents: "none",
  }
  return (
    <>
      <div style={{ ...wrap, top: offset, left: offset }}>
        <Flourish orientation="tl" size={size} />
      </div>
      <div style={{ ...wrap, top: offset, right: offset }}>
        <Flourish orientation="tr" size={size} />
      </div>
      <div style={{ ...wrap, bottom: offset, left: offset }}>
        <Flourish orientation="bl" size={size} />
      </div>
      <div style={{ ...wrap, bottom: offset, right: offset }}>
        <Flourish orientation="br" size={size} />
      </div>
    </>
  )
}
