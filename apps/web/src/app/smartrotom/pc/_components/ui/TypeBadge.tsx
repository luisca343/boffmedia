import { typeColor } from "../../_utils/typeColors"

const LABELS: Record<string, string> = {
  normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico", grass: "Planta",
  ice: "Hielo", fighting: "Lucha", poison: "Veneno", ground: "Tierra", flying: "Volador",
  psychic: "Psíquico", bug: "Bicho", rock: "Roca", ghost: "Fantasma", dragon: "Dragón",
  dark: "Siniestro", steel: "Acero", fairy: "Hada",
}

export interface TypeBadgeProps {
  type: string
  size?: "sm" | "md"
}

/**
 * The type colours are data, so they are applied inline — an interpolated
 * `bg-${type}-500` would silently never compile (SMARTROTOM_V3.md §4).
 */
export function TypeBadge({ type, size = "md" }: TypeBadgeProps) {
  const t = type.toLowerCase()
  const { c, t: fg } = typeColor(t)
  return (
    <span
      className={[
        "inline-flex items-center rounded-pc-pill font-pc font-bold tracking-[.02em]",
        size === "sm" ? "px-[7px] py-[2px] text-[10px]" : "px-[9px] py-[3px] text-[11px]",
      ].join(" ")}
      style={{ background: c, color: fg, boxShadow: `0 2px 8px -2px ${c}99` }}
    >
      {LABELS[t] ?? type}
    </span>
  )
}
