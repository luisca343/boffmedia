import type { WpSpriteWall } from "../_types/market.types"

/**
 * Every Pokémon sprite in Wigglypop sits on a pastel wash, and which wash is
 * data-driven: shiny wins, then legendary, then the mon's primary type. Same rule
 * as `rarity.ts` — the classes are **literals in a map**, never `wp-wall-${type}`,
 * which the JIT would never compile.
 *
 * Shiny takes ocean and legendary takes dusk on purpose: those two washes are the
 * coolest and the most violet in the set, so the teal shiny burst and the gold
 * legendary aura read at full strength against them.
 */

const BY_TYPE: Record<string, WpSpriteWall> = {
  fire: "volcano",
  water: "ocean",
  grass: "meadow",
  electric: "rainbow",
  psychic: "dusk",
  ghost: "space",
  dragon: "space",
  ice: "ocean",
  rock: "cave",
  ground: "cave",
  dark: "cave",
}

export function spriteWall(mon: {
  shiny?: boolean
  legendary?: boolean
  types?: string[]
}): WpSpriteWall {
  if (mon.shiny) return "ocean"
  if (mon.legendary) return "dusk"
  return BY_TYPE[mon.types?.[0] ?? ""] ?? "classic"
}

export const WALL_CLASS: Record<WpSpriteWall, string> = {
  classic: "wp-wall-classic",
  forest: "wp-wall-forest",
  ocean: "wp-wall-ocean",
  volcano: "wp-wall-volcano",
  space: "wp-wall-space",
  meadow: "wp-wall-meadow",
  dusk: "wp-wall-dusk",
  cave: "wp-wall-cave",
  rainbow: "wp-wall-rainbow",
  sakura: "wp-wall-sakura",
}

/** Convenience: the wash class for a Pokémon, in one call. */
export const wallClassFor = (mon: Parameters<typeof spriteWall>[0]): string =>
  WALL_CLASS[spriteWall(mon)]
