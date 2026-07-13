import type { CSSProperties } from "react"

/**
 * Rooker's icon set — 36 stroke glyphs on a 24px box, drawn to one weight.
 *
 * Inline SVG from a local map, never `lucide-react` (§10): the icon set is part of
 * the visual identity, and a second stroke weight in the action bar is exactly the
 * kind of drift the migrations removed.
 *
 * Every path is authored so that splitting on `M` yields independent subpaths — that
 * is what lets a single `d` string render as several strokes with round caps.
 */
const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  compose: "M4 20h16M6 16l9.5-9.5a2.1 2.1 0 0 0-3-3L3 13v3h3z",
  feather: "M20 6a6 6 0 0 0-8.5 0L4 13.5V20h6.5L18 12.5A6 6 0 0 0 20 6zM4 20l7-7M14 8l2 2",
  reply: "M9 17l-5-5 5-5M5 12h9a5 5 0 0 1 5 5v2",
  retrino: "M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  heart: "M12 20s-7-4.4-9.5-8.5C.7 8.4 2.2 5 5.5 5 7.5 5 9 6.3 12 9c3-2.7 4.5-4 6.5-4 3.3 0 4.8 3.4 3 6.5C19 15.6 12 20 12 20z",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13",
  views: "M3 20V10M9 20V4M15 20v-8M21 20v-5",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  verified: "M12 2l2.4 1.8 3-.2 1 2.8 2.6 1.6-.9 2.9.9 2.9-2.6 1.6-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3 16.2l.9-2.9L3 10.4l2.6-1.6 1-2.8 3 .2z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  bolt: "M13 2 4 14h6l-1 8 9-12h-6z",
  trophy: "M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 16h6M8 20h8M10 16v-1.5M14 16v-1.5",
  sword: "M14 3h7v7M21 3l-9 9M3 21l4-1 9-9-3-3-9 9zM7 20l-3-3",
  sparkle:
    "M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8zM5 15l.6 1.6L7 17l-1.4.4L5 19l-.6-1.6L3 17l1.4-.4z",
  pin: "M12 2a5 5 0 0 1 5 5c0 3.5-5 11-5 11S7 10.5 7 7a5 5 0 0 1 5-5zM12 7h.01",
  location: "M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  calendar: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M8 2v4M16 2v4",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M22 19v-1a4 4 0 0 0-3-3.8M16 4.2a3.5 3.5 0 0 1 0 6.6",
  flame:
    "M12 22c4 0 7-2.6 7-6.5 0-3-2-5.4-3-7-.4 1.6-1.6 2.4-2.6 2.4C13 8 14 4 11 2c0 3-2.2 4-3.6 6C6 10 5 12.4 5 15.5 5 19.4 8 22 12 22zM12 22c-1.7 0-3-1.2-3-3 0-1.3.9-2.3 1.6-3.2.3 1 .9 1.4 1.5 1.4 1 0 1.4-1.4 1-2.6 1 .8 1.9 2 1.9 3.4 0 1.8-1.3 3-3 3z",
  image: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M21 16l-5-5-7 7",
  poll: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  gif: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  smile: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 10h.01M15 10h.01M8.5 14a4 4 0 0 0 7 0",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 9h17M3.5 15h17M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13H3a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 4.6 6.3l-.1-.1A2 2 0 1 1 7.3 3.4l.1.1A1.6 1.6 0 0 0 9 4V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.4 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z",
  back: "M19 12H5M12 19l-7-7 7-7",
  close: "M18 6 6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5",
  play: "M6 4l14 8-14 8z",
  shield: "M12 2 4 5v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V5z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.6 6.6 20l1-6.1L3.2 9.5l6.1-.9z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  fire: "M12 22c4 0 7-2.6 7-6.5 0-3-2-5.4-3-7-.4 1.6-1.6 2.4-2.6 2.4C13 8 14 4 11 2c0 3-2.2 4-3.6 6C6 10 5 12.4 5 15.5 5 19.4 8 22 12 22z",
  hash: "M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
  trending: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  bookmark: "M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z",
  chevron: "M9 6l6 6-6 6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
} as const

export type IconName = keyof typeof PATHS

export interface IconProps {
  name: IconName
  size?: number
  /** Ignored when `fill` is set — a filled glyph has no stroke. */
  stroke?: number
  fill?: boolean
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 20, stroke = 1.9, fill = false, className = "", style }: IconProps) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {d
        .split("M")
        .filter(Boolean)
        .map((seg, i) => (
          <path key={i} d={`M${seg}`} />
        ))}
    </svg>
  )
}
