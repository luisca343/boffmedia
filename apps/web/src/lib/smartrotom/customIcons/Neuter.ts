import { createLucideIcon } from "lucide-react"

// Pokémon genderless symbol ⚲ — lucide 0.452 ships no gender glyphs. Consumed by
// pokemonDisplayUtils and the pc icon map.
export const Neuter = createLucideIcon("Neuter", [
  ["circle", { cx: "12", cy: "10", r: "6", key: "c" }],
  ["line", { x1: "12", y1: "16", x2: "12", y2: "20", key: "l" }],
])
