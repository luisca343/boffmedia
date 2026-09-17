import { useTranslations } from "next-intl"
import { TYPE_LABEL_KEYS } from "../../_utils/typeColors"
import { PokemonTypeGlyph } from "@boffmedia/ui"

// Chip background + contrasting ink per type. Move-damage categories
// (physical/special/status) reuse the same chip so tables stay consistent.
// Client component on purpose: most call sites are already client, and a server
// call site can render it across the boundary without an async signature.
const TYPE_CHIP_COLORS: Record<string, { bg: string; fg: string }> = {
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

// Message keys for the move-damage categories (types come from TYPE_LABEL_KEYS).
const CATEGORY_LABEL_KEYS: Record<string, string> = {
  physical: "type_physical",
  special: "type_special",
  status: "type_status",
}

const SIZES = {
  sm: { padX: 7, fs: 10, gap: 4, glyph: 9, h: 18, radius: 4 },
  md: { padX: 9, fs: 11, gap: 5, glyph: 11, h: 22, radius: 5 },
  lg: { padX: 12, fs: 13, gap: 7, glyph: 14, h: 28, radius: 7 },
}

export function TypeGlyph({ type, size = 12 }: { type: string; size?: number }) {
  return <PokemonTypeGlyph type={type} size={size} />
}

export function TypeChip({
  type,
  size = "md",
  showGlyph = true,
  showLabel = true,
}: {
  type: string
  size?: "sm" | "md" | "lg"
  showGlyph?: boolean
  showLabel?: boolean
}) {
  const t = useTranslations("pokedex")
  const key = type.toLowerCase()
  const colors = TYPE_CHIP_COLORS[key]
  if (!colors) return null
  const s = SIZES[size]
  const labelKey = TYPE_LABEL_KEYS[key] ?? CATEGORY_LABEL_KEYS[key]
  const label = labelKey ? t(labelKey) : type

  return (
    <span
      className="inline-flex items-center font-pk-display font-semibold uppercase whitespace-nowrap shadow-pk-chip"
      style={{
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.padX}px`,
        background: colors.bg,
        color: colors.fg,
        fontSize: s.fs,
        letterSpacing: ".06em",
        borderRadius: s.radius,
      }}
    >
      {showGlyph && <TypeGlyph type={key} size={s.glyph} />}
      {showLabel && label}
    </span>
  )
}
