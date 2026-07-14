import { createLucideIcon } from "lucide-react"

// Pokémon gender symbol ♂ — lucide 0.452 ships no gender glyphs. Consumed by
// pokemonDisplayUtils and the pc/wigglypop icon maps.
export const Mars = createLucideIcon("Mars", [
  ["circle", { cx: "9", cy: "15", r: "6", key: "c" }],
  ["line", { x1: "13.4", y1: "10.6", x2: "20", y2: "4", key: "l" }],
  ["polyline", { points: "14 4 20 4 20 10", key: "p" }],
])
