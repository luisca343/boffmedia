/**
 * Pokémon type colours, in Wigglypop's own values.
 *
 * These deliberately do NOT reuse the PC's map: Wigglypop's badges sit on white
 * cards over a pink page, so the handoff picked hues a few points more saturated
 * than the PC's (which sit on a slate void). Same eighteen types, different tuning
 * — importing the PC's would wash out here.
 *
 * Data-driven, so they are applied via inline `style`, never as an interpolated
 * class — `bg-${type}` silently never compiles (§4). Raw hex is sanctioned for
 * exactly this case.
 *
 * `c` is the fill, `t` the text that sits on it (chosen for contrast, which is why
 * the light types carry near-black text rather than white).
 */
export const TYPE_COLORS: Record<string, { c: string; t: string }> = {
  normal: { c: "#9fa19f", t: "#ffffff" },
  fire: { c: "#ff6b3d", t: "#ffffff" },
  water: { c: "#3692dc", t: "#ffffff" },
  electric: { c: "#f2c037", t: "#1b1b1b" },
  grass: { c: "#3fa34d", t: "#ffffff" },
  ice: { c: "#52c4c4", t: "#08343a" },
  fighting: { c: "#d3425f", t: "#ffffff" },
  poison: { c: "#a552cc", t: "#ffffff" },
  ground: { c: "#da7c4d", t: "#ffffff" },
  flying: { c: "#8aa9e3", t: "#08182f" },
  psychic: { c: "#f86fa0", t: "#ffffff" },
  bug: { c: "#92bc2c", t: "#0e2300" },
  rock: { c: "#c5b78c", t: "#1b1500" },
  ghost: { c: "#7b62a3", t: "#ffffff" },
  dragon: { c: "#0c69c8", t: "#ffffff" },
  dark: { c: "#595761", t: "#ffffff" },
  steel: { c: "#5a8ea2", t: "#ffffff" },
  fairy: { c: "#ee90e6", t: "#3a0c36" },
}

export const typeColor = (type: string) =>
  TYPE_COLORS[type.toLowerCase()] ?? { c: "#8892a4", t: "#ffffff" }

/** The eighteen, in the canonical dex order the filter rail lists them in. */
export const ALL_TYPES = Object.keys(TYPE_COLORS)

/** Per-stat hues, shared by the IV meter and the detail page's stat bars. */
export const STAT_COLORS: Record<string, string> = {
  hp: "#ff5d5d",
  atk: "#f5a33c",
  def: "#f5d23c",
  spa: "#3ca6f5",
  spd: "#3cf5b0",
  spe: "#c77cf5",
}

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const
export const STAT_LABELS: Record<string, string> = {
  hp: "PS",
  atk: "Ataque",
  def: "Defensa",
  spa: "At. Esp.",
  spd: "Def. Esp.",
  spe: "Velocidad",
}
