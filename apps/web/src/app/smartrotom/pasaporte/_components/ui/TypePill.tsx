// PAPER. The type inks are the classic Pokémon palette — they are NOT security inks and
// do not follow the chapter accent.

import { cn } from "@/lib/utils"

/**
 * A literal map, applied through inline `style`. `bg-${type}` would compile to nothing at
 * all (§4), and eighteen full class strings for a value that arrives as free-form text
 * from the game server would be eighteen ways to miss.
 *
 * Accents and case are normalised because the server sends the Spanish names as typed
 * ("Eléctrico", "electrico", "ELÉCTRICO" are one type).
 */
const TYPE_INK: Record<string, string> = {
  normal: "#a8a878",
  roca: "#b8a038",
  planta: "#78c850",
  agua: "#6890f0",
  fuego: "#f08030",
  electrico: "#f8d030",
  veneno: "#a040a0",
  psiquico: "#f85888",
  bicho: "#a8b820",
  hielo: "#98d8d8",
  dragon: "#7038f8",
  siniestro: "#705848",
  hada: "#ee99ac",
  lucha: "#c03028",
  acero: "#b8b8d0",
  fantasma: "#705898",
  tierra: "#e0c068",
  volador: "#a890f0",
}

/** Unknown type: the faint ink, so an unmapped name still reads as a pill and not as void. */
const UNKNOWN = "#8a7d68"

function key(type: string): string {
  return type
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export function TypePill({ type, className }: { type: string; className?: string }) {
  return (
    <span
      style={{ background: TYPE_INK[key(type)] ?? UNKNOWN }}
      className={cn(
        "inline-block rounded-[10px] px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-[.08em] text-white",
        className,
      )}
    >
      {type}
    </span>
  )
}
