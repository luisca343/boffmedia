import { createLucideIcon } from "lucide-react";

// lucide-react 0.452 ships no gender glyphs, so the three Pokémon gender
// symbols are hand-drawn here as real LucideIcons (size/strokeWidth/className
// behave exactly like any lucide import). Consumed by pokemonDisplayUtils and
// the pc/wigglypop icon maps.

export const Mars = createLucideIcon("Mars", [
  ["circle", { cx: "9", cy: "15", r: "6", key: "c" }],
  ["line", { x1: "13.4", y1: "10.6", x2: "20", y2: "4", key: "l" }],
  ["polyline", { points: "14 4 20 4 20 10", key: "p" }],
]);

export const Venus = createLucideIcon("Venus", [
  ["circle", { cx: "12", cy: "9", r: "6", key: "c" }],
  ["line", { x1: "12", y1: "15", x2: "12", y2: "21", key: "l1" }],
  ["line", { x1: "8", y1: "18", x2: "16", y2: "18", key: "l2" }],
]);

export const Neuter = createLucideIcon("Neuter", [
  ["circle", { cx: "12", cy: "10", r: "6", key: "c" }],
  ["line", { x1: "12", y1: "16", x2: "12", y2: "20", key: "l" }],
]);
