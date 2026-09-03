import { cn } from "../cn"

// Canonical Pokémon type colours. Spanish-keyed (the tools speak Spanish) with
// English fallbacks, since sources return either language. Mirrors the Meta kit.
export const TYPE_COLORS: Record<string, string> = {
  Normal: "#9fa19f", Fuego: "#e62829", Agua: "#2980ef", Eléctrico: "#fac000",
  Planta: "#3fa129", Hielo: "#3dcef3", Lucha: "#ff8000", Veneno: "#9141cb",
  Tierra: "#915121", Volador: "#81b9ef", Psíquico: "#ef4179", Bicho: "#91a119",
  Roca: "#afa981", Fantasma: "#704170", Dragón: "#5060e1", Siniestro: "#624d4e",
  Acero: "#60a1b8", Hada: "#ef70ef",
  // English fallbacks (some sources return canonical names).
  Fire: "#e62829", Water: "#2980ef", Electric: "#fac000", Grass: "#3fa129",
  Ice: "#3dcef3", Fighting: "#ff8000", Poison: "#9141cb", Ground: "#915121",
  Flying: "#81b9ef", Psychic: "#ef4179", Bug: "#91a119", Rock: "#afa981",
  Ghost: "#704170", Dragon: "#5060e1", Dark: "#624d4e", Steel: "#60a1b8",
  Fairy: "#ef70ef",
}

/** The eighteen canonical types, English, in Pokédex order. `TYPE_COLORS` is a
 *  LOOKUP (Spanish + English keys for the same eighteen colours), so anything
 *  that needs a *list* — a type dropdown, a coverage grid — must read this and
 *  not `Object.keys(TYPE_COLORS)`, which would yield 35 entries with duplicates. */
export const TYPE_NAMES_EN = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
] as const

// Lower-cased index so lookups tolerate any casing (e.g. "fire", "FUEGO").
const TYPE_COLORS_LC: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_COLORS).map(([k, v]) => [k.toLowerCase(), v]),
)

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? TYPE_COLORS_LC[type?.toLowerCase()] ?? "var(--dim)"
}

/** Pokémon type label in its canonical colour. */
export function DkType({ type, small }: { type: string; small?: boolean }) {
  return (
    <span
      className={cn(
        "cut [--cut:3px] inline-flex items-center font-mono font-bold uppercase tracking-[0.08em] text-white",
        small ? "px-1.5 py-[3px] text-[0.5625rem]/none" : "px-2 py-1 text-[0.625rem]/none",
      )}
      style={{ background: typeColor(type), textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
    >
      {type}
    </span>
  )
}
