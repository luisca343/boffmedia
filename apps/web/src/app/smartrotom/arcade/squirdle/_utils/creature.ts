import type { PixelArtSprite } from "../../_components/ui"

// Original 12×12 creature silhouette — the arcade draws its own art, it never
// ships Pokémon assets.
const CREATURE: string[] = [
  "....aaaa....",
  "..aaaaaaaa..",
  ".aaaaaaaaaa.",
  ".aabaaaabaa.",
  ".aabbaabbaa.",
  ".aaaaaaaaaa.",
  ".aaaccaaaaa.",
  ".aaaccaaaaa.",
  "..aaaaaaaa..",
  "..aa.aa.aa..",
  "..aa.aa.aa..",
  "...a..a..a..",
]

const VOID = "#06031a"

// A guess is tinted by its primary type, so the row reads at a glance. Data-driven
// fills, applied inline — the sanctioned raw-hex exception.
const TYPE_TONE: Record<string, string> = {
  normal: "#bcb9dc",
  fire: "#ff2e93",
  water: "#00e5ff",
  electric: "#ffb845",
  grass: "#7af8ca",
  ice: "#79f2ff",
  fighting: "#ff6d6d",
  poison: "#a855ff",
  ground: "#ffb845",
  flying: "#c79bff",
  psychic: "#ff6dbf",
  bug: "#7af8ca",
  rock: "#8b85ad",
  ghost: "#a855ff",
  dragon: "#79f2ff",
  dark: "#8b85ad",
  steel: "#bcb9dc",
  fairy: "#ff6dbf",
}

export const toneForType = (type: string | undefined) => TYPE_TONE[type ?? ""] ?? "#00e5ff"

export const creatureSprite = (tone: string): PixelArtSprite => ({
  bitmap: CREATURE,
  legend: { a: tone, b: VOID, c: VOID },
})
