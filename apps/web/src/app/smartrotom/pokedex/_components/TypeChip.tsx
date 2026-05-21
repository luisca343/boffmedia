"use client"

import { useTranslations } from "next-intl"

const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  normal: { bg: "#9fa19f", fg: "#1a1a1a" },
  fire: { bg: "#e62829", fg: "#fff" },
  water: { bg: "#2980ef", fg: "#fff" },
  grass: { bg: "#3fa129", fg: "#fff" },
  electric: { bg: "#fac000", fg: "#1a1a1a" },
  ice: { bg: "#3fd8ff", fg: "#0a3a4a" },
  fighting: { bg: "#ff8000", fg: "#fff" },
  poison: { bg: "#9141cb", fg: "#fff" },
  ground: { bg: "#d6985c", fg: "#3a1f0a" },
  flying: { bg: "#81b9ef", fg: "#0a2a4a" },
  psychic: { bg: "#ef4179", fg: "#fff" },
  bug: { bg: "#91a119", fg: "#fff" },
  rock: { bg: "#afa981", fg: "#1a1a1a" },
  ghost: { bg: "#704170", fg: "#fff" },
  dragon: { bg: "#5061e1", fg: "#fff" },
  dark: { bg: "#50413f", fg: "#fff" },
  steel: { bg: "#60a1b8", fg: "#fff" },
  fairy: { bg: "#ef71ef", fg: "#3a0a3a" },
  physical: { bg: "#ff4400", fg: "#fff" },
  special: { bg: "#2266cc", fg: "#fff" },
  status: { bg: "#999999", fg: "#1a1a1a" },
}

const TYPE_GLYPHS: Record<string, React.ReactNode> = {
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

const SIZES = {
  sm: { padX: 7, fs: 10, gap: 4, glyph: 9, h: 18, radius: 4 },
  md: { padX: 9, fs: 11, gap: 5, glyph: 11, h: 22, radius: 5 },
  lg: { padX: 12, fs: 13, gap: 7, glyph: 14, h: 28, radius: 7 },
}

export function TypeGlyph({ type, size = 12 }: { type: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      {TYPE_GLYPHS[type] || TYPE_GLYPHS.normal}
    </svg>
  )
}

export function TypeChip({ type, size = "md" }: { type: string; size?: "sm" | "md" | "lg" }) {
  const t = useTranslations("pokedex")
  const colors = TYPE_COLORS[type.toLowerCase()]
  if (!colors) return null
  const s = SIZES[size]

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.padX}px`,
        background: colors.bg,
        color: colors.fg,
        fontFamily: "var(--font-orbitron, 'Orbitron', system-ui, sans-serif)",
        fontWeight: 600,
        fontSize: s.fs,
        letterSpacing: ".06em",
        textTransform: "uppercase",
        borderRadius: s.radius,
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.18)",
        whiteSpace: "nowrap",
      }}
    >
      <TypeGlyph type={type.toLowerCase()} size={s.glyph} />
      {t(`type_${type.toLowerCase()}` as any)}
    </span>
  )
}
