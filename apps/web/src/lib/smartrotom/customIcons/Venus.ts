import { createLucideIcon } from "lucide-react"

// Pokémon gender symbol ♀ — lucide 0.452 ships no gender glyphs. Consumed by
// pokemonDisplayUtils and the pc/wigglypop icon maps.
export const Venus = createLucideIcon("Venus", [
  ["circle", { cx: "12", cy: "9", r: "6", key: "c" }],
  ["line", { x1: "12", y1: "15", x2: "12", y2: "21", key: "l1" }],
  ["line", { x1: "8", y1: "18", x2: "16", y2: "18", key: "l2" }],
])
