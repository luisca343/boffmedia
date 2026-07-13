/**
 * The ten box wallpapers.
 *
 * The theme is a *data* value (it comes out of the user's saved box meta), so the
 * wallpaper class can never be built by interpolation — `pc-wp-${theme}` compiles
 * to nothing and the box silently renders bare (SMARTROTOM_V3.md §4, audit gap G2).
 * Hence the full-class map. The gradients themselves live in `tailwind.config.ts`.
 *
 * The accent is applied inline (a data-driven value on a gradient/border), which is
 * the other sanctioned escape hatch.
 */
export const BOX_THEMES = [
  "classic", "forest", "ocean", "volcano", "space",
  "meadow", "dusk", "cave", "rainbow", "sakura",
] as const

export type BoxTheme = (typeof BOX_THEMES)[number]

export const WALLPAPER_CLASS: Record<BoxTheme, string> = {
  classic: "pc-wp-classic",
  forest: "pc-wp-forest",
  ocean: "pc-wp-ocean",
  volcano: "pc-wp-volcano",
  space: "pc-wp-space",
  meadow: "pc-wp-meadow",
  dusk: "pc-wp-dusk",
  cave: "pc-wp-cave",
  rainbow: "pc-wp-rainbow",
  sakura: "pc-wp-sakura",
}

export const THEME_ACCENT: Record<BoxTheme, string> = {
  classic: "#4f9bff",
  forest: "#38d39f",
  ocean: "#38d3e0",
  volcano: "#ff6b3d",
  space: "#a78bfa",
  meadow: "#a3e635",
  dusk: "#e879c9",
  cave: "#94a3b8",
  rainbow: "#f5b740",
  sakura: "#fb7eb6",
}

export const THEME_LABEL: Record<BoxTheme, string> = {
  classic: "Clásico",
  forest: "Bosque",
  ocean: "Océano",
  volcano: "Volcán",
  space: "Espacio",
  meadow: "Pradera",
  dusk: "Ocaso",
  cave: "Cueva",
  rainbow: "Arcoíris",
  sakura: "Sakura",
}

/** A box with no saved theme still looks deliberate: cycle the ten by index. */
export const defaultTheme = (boxNumber: number): BoxTheme =>
  BOX_THEMES[boxNumber % BOX_THEMES.length]

/** How full a box is, as a colour. Green → amber → orange → rose as it fills up. */
export function fillTone(count: number): string {
  if (count === 0) return "rgb(var(--pc-fg-subtle))"
  if (count < 10) return "rgb(var(--pc-green))"
  if (count < 20) return "rgb(var(--pc-amber))"
  if (count < 30) return "#ff8a3d"
  return "rgb(var(--pc-rose))"
}
