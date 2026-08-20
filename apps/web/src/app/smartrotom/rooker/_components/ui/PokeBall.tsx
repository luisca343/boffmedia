/**
 * The Poké Ball — the "¡Captura!" reaction glyph, and the ball chip on a capture card.
 *
 * The five ball styles are a data-driven colour set, so they live as a JS map applied
 * through `fill` attributes rather than as Tailwind classes: a `fill-${variant}`
 * fragment would never compile.
 */
export type BallVariant = "ball-poke" | "ball-great" | "ball-ultra" | "ball-luxury" | "ball-quick"

const BALL_STYLES: Record<BallVariant, { top: string; btn: string }> = {
  "ball-poke": { top: "#ef4444", btn: "#e5e7eb" },
  "ball-great": { top: "#3b82f6", btn: "#e5e7eb" },
  "ball-ultra": { top: "#1f2937", btn: "#fbbf24" },
  "ball-luxury": { top: "#111827", btn: "#f59e0b" },
  "ball-quick": { top: "#38bdf8", btn: "#fde047" },
}

export const BALL_NAME: Record<BallVariant, string> = {
  "ball-poke": "Poké Ball",
  "ball-great": "Super Ball",
  "ball-ultra": "Ultra Ball",
  "ball-luxury": "Lujo Ball",
  "ball-quick": "Veloz Ball",
}

export interface PokeBallProps {
  size?: number
  variant?: BallVariant
  className?: string
}

export function PokeBall({ size = 18, variant = "ball-poke", className = "" }: PokeBallProps) {
  const c = BALL_STYLES[variant] ?? BALL_STYLES["ball-poke"]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#fff" stroke="#0b1220" strokeWidth="1.4" />
      <path d="M1.3 12a10.7 10.7 0 0 1 21.4 0z" fill={c.top} />
      <path d="M1 12h22" stroke="#0b1220" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.4" fill={c.btn} stroke="#0b1220" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="1.4" fill="#fff" stroke="#0b1220" strokeWidth="1" />
    </svg>
  )
}
