import type { ReactNode, SVGProps } from "react"

export interface GoldCoinProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number
}

/** SmartRotom currency artwork; intentionally keeps its own gold palette. */
export function GoldCoin({ size = 18, ...props }: GoldCoinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" {...props}>
      <defs>
        <radialGradient id="ar-coin-au" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffe9a3" />
          <stop offset="55%" stopColor="#f6c945" />
          <stop offset="100%" stopColor="#c98a1b" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#ar-coin-au)" stroke="#8a5a10" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#8a5a10" strokeWidth="1" opacity=".55" />
      <path
        d="M12 7.6l1.35 2.74 3.02.44-2.18 2.13.51 3.01L12 14.5l-2.7 1.42.51-3.01-2.18-2.13 3.02-.44L12 7.6Z"
        fill="#8a5a10"
        opacity=".85"
      />
    </svg>
  )
}

export interface RookerMarkProps {
  size?: number
  filled?: boolean
  className?: string
}

/** Rooker wordmark artwork; explicit exception to the generic glyph registry. */
export function RookerMark({ size = 28, filled = true, className = "" }: RookerMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      {filled ? (
        <path
          fill="currentColor"
          d="M8 37C12 39 15 40 20 40L18 35C16 31 16 28 17 25C21 25 25 26 29 28C31 24 34 21 38 19C37 17 36 14 37 11L42 15L42 12L45 15L45 11L49 15L50 13L53 20L58 20L54 22C56 25 57 29 57 33C57 44 49 52 37 52C31 52 26 49 22 44L20 43C17 42 13 41 8 37Z"
        />
      ) : (
        <>
          <g fill="none" stroke="currentColor" strokeWidth={3.25} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 37C12 39 15 40 20 40L18 35C16 31 16 28 17 25C21 25 25 26 29 28C31 24 34 21 38 19C37.2 16.4 36.7 13.5 37 11L42.5 15L44.5 10.5L48.5 15L50 13L53 20L58 20L54 22C56 25 57 29 57 33C57 44 49 52 37 52C31 52 26 49 22 44L20 43C17 42 13 41 8 37Z" />
            <path d="M30 35C34 32.5 39.5 33 43 38C39 40.5 34 39.5 30 35Z" />
          </g>
          <circle cx="46.5" cy="20" r="1.9" fill="currentColor" />
        </>
      )}
    </svg>
  )
}

export interface RotomMarkProps {
  size?: number
  filled?: boolean
  className?: string
}

/** Large SmartRotom brand artwork; separate from the small `Icon` glyph. */
export function RotomMark({ size = 28, filled = true, className = "" }: RotomMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g transform="rotate(-8 32 32)">
        {filled ? (
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M21 10H34L38 3L42 10H43A5 5 0 0 1 48 15V49A5 5 0 0 1 43 54H31L27.5 60.5L24 54H21A5 5 0 0 1 16 49V15A5 5 0 0 1 21 10ZM20.9 16.5A1.7 1.7 0 1 0 24.3 16.5A1.7 1.7 0 1 0 20.9 16.5ZM21.2 31A4.3 5.8 0 1 0 29.8 31A4.3 5.8 0 1 0 21.2 31ZM34.2 31A4.3 5.8 0 1 0 42.8 31A4.3 5.8 0 1 0 34.2 31ZM22.5 43Q32 46 41.5 43Q32 52 22.5 43Z"
          />
        ) : (
          <>
            <g fill="none" stroke="currentColor" strokeWidth={3.25} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10H34L38 3L42 10H43A5 5 0 0 1 48 15V49A5 5 0 0 1 43 54H31L27.5 60.5L24 54H21A5 5 0 0 1 16 49V15A5 5 0 0 1 21 10Z" />
              <ellipse cx="25.5" cy="31" rx="4.3" ry="5.8" />
              <ellipse cx="38.5" cy="31" rx="4.3" ry="5.8" />
              <path d="M24 43.5Q32 49 40 43.5" />
            </g>
            <circle cx="22.6" cy="16.5" r="1.8" fill="currentColor" />
          </>
        )}
      </g>
    </svg>
  )
}

const POKEMON_TYPE_GLYPHS: Record<string, ReactNode> = {
  fire: <path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 2-3 2-5 0 2 2 3 2 5" />,
  water: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" />,
  grass: <path d="M12 22c0-6 5-10 10-12-2 8-6 12-10 12ZM12 22c0-6-5-10-10-12 2 8 6 12 10 12Z" />,
  electric: <path d="m13 2-9 13h7l-2 7 9-13h-7l2-7Z" />,
  ice: <path d="M12 2v20M2 12h20M4 4l16 16M20 4 4 20" />,
  fighting: <path d="M7 4h10v8a5 5 0 0 1-10 0V4Z" />,
  poison: <path d="M12 3a4 4 0 0 0-4 4v3h8V7a4 4 0 0 0-4-4ZM5 10h14l-2 11H7L5 10Z" />,
  ground: <path d="M3 16h18M5 16l3-6 4 4 3-3 4 5" />,
  flying: <path d="M2 12c4-6 9-9 20-9-3 4-7 7-12 9 4 0 7 0 10 2-5 2-12 2-18-2Z" />,
  psychic: <path d="M12 2 22 12 12 22 2 12Z" />,
  bug: <path d="M12 3v18M3 8h18M3 16h18M6 5l3 3M18 5l-3 3M6 19l3-3M18 19l-3-3" />,
  rock: <path d="m12 3 9 7-4 11H7L3 10Z" />,
  ghost: <path d="M5 22V10a7 7 0 0 1 14 0v12l-3-2-2 2-2-2-2 2-2-2-3 2Z" />,
  dragon: <path d="m12 2 10 18H2Z" />,
  dark: <path d="M22 12a10 10 0 1 1-10-10A8 8 0 0 0 22 12Z" />,
  steel: <path d="M5 5l7-3 7 3 3 7-3 7-7 3-7-3-3-7Z" />,
  fairy: <path d="M12 2v8l7-4-3 8 7 0-7 4 3 8-7-4v8l-7-4 3-8H2l7-4-3-8 7 4Z" />,
  normal: <circle cx="12" cy="12" r="6" />,
}

export function PokemonTypeGlyph({ type, size = 12 }: { type: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      {POKEMON_TYPE_GLYPHS[type] || POKEMON_TYPE_GLYPHS.normal}
    </svg>
  )
}

export function PokeballIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M2 12h20" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.4" fill={color} />
    </svg>
  )
}

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
  const colors = BALL_STYLES[variant] ?? BALL_STYLES["ball-poke"]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#fff" stroke="#0b1220" strokeWidth="1.4" />
      <path d="M1.3 12a10.7 10.7 0 0 1 21.4 0z" fill={colors.top} />
      <path d="M1 12h22" stroke="#0b1220" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.4" fill={colors.btn} stroke="#0b1220" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="1.4" fill="#fff" stroke="#0b1220" strokeWidth="1" />
    </svg>
  )
}

export function WigglypopMark({ size = 23, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 4h14a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 19 17h-6.5L7 21v-4H5a2.5 2.5 0 0 1-2.5-2.5v-8A2.5 2.5 0 0 1 5 4z"
        fill="#fff"
      />
      <circle cx="9.4" cy="10" r="1.5" fill="#ef4f97" />
      <circle cx="14.6" cy="10" r="1.5" fill="#ef4f97" />
      <path d="M9.6 12.6q2.4 2 4.8 0" stroke="#ef4f97" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
