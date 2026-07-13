/**
 * Pokémon type colours. Data-driven, so they are applied via inline `style`, never
 * as an interpolated class — `bg-${type}` would silently never compile
 * (SMARTROTOM_V3.md §4, audit gap G2). Raw hex is sanctioned for exactly this.
 *
 * `c` is the fill, `t` the text that sits on it.
 */
export const TYPE_COLORS: Record<string, { c: string; t: string }> = {
  normal:   { c: "#9099a1", t: "#fff" },
  fire:     { c: "#ff9d55", t: "#3a1a00" },
  water:    { c: "#4d90d5", t: "#fff" },
  electric: { c: "#f3d23b", t: "#3a2f00" },
  grass:    { c: "#63bb5b", t: "#fff" },
  ice:      { c: "#73cec0", t: "#053430" },
  fighting: { c: "#ce4069", t: "#fff" },
  poison:   { c: "#aa6bc8", t: "#fff" },
  ground:   { c: "#d97946", t: "#fff" },
  flying:   { c: "#8fa8dd", t: "#10203f" },
  psychic:  { c: "#fa7179", t: "#fff" },
  bug:      { c: "#90c12c", t: "#1d2b00" },
  rock:     { c: "#c7b78b", t: "#2b2411" },
  ghost:    { c: "#5269ad", t: "#fff" },
  dragon:   { c: "#0b6dc3", t: "#fff" },
  dark:     { c: "#5a5465", t: "#fff" },
  steel:    { c: "#5a8ea2", t: "#fff" },
  fairy:    { c: "#ec8fe6", t: "#3d0a38" },
}

export const typeColor = (type: string) =>
  TYPE_COLORS[type.toLowerCase()] ?? { c: "#8892a4", t: "#fff" }
