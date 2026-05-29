"use client"

export interface CandleGlowProps {
  on: boolean
  intensity?: number
}

export function CandleGlow({ on, intensity = 0.5 }: CandleGlowProps) {
  if (!on) return null
  return (
    <div className="candle-glow" aria-hidden="true" style={{
      position: "fixed", inset: 0, zIndex: 9, pointerEvents: "none",
      mixBlendMode: "soft-light",
      background:
        `radial-gradient(ellipse 70% 55% at 50% 8%, rgba(255,196,92,${0.32 * intensity}), transparent 60%),`
        + `radial-gradient(ellipse 120% 90% at 50% 120%, rgba(0,0,0,${0.5 * intensity}), transparent 55%)`,
    }}/>
  )
}
