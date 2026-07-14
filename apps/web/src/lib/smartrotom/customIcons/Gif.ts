import { createLucideIcon } from "lucide-react"

// GIF badge (rounded rect + stroked G/I/F) — lucide ships no GIF glyph.
// Consumed by rooker's composer row.
export const Gif = createLucideIcon("Gif", [
  ["rect", { x: "2.5", y: "6", width: "19", height: "12", rx: "2.5", key: "r" }],
  ["path", { d: "M8.6 9.9H6.9a1.9 1.9 0 0 0-1.9 1.9v.4a1.9 1.9 0 0 0 1.9 1.9h1.7v-2.3H7.4", key: "g" }],
  ["path", { d: "M11.9 9.9v4.2", key: "i" }],
  ["path", { d: "M15 14.1V9.9h3.1M15 11.9h2.5", key: "f" }],
])
