// Surface-agnostic: every glyph paints in `currentColor`, so it is the desk or the paper
// ink of whatever it is placed in.

import { cn } from "@/lib/utils"

/**
 * Pasaporte's icon set — one inline-SVG map, no `lucide-react` (SMARTROTOM_V3.md §10).
 * Every glyph is a 24×24 round-capped 2px stroke so they sit together as one engraved
 * set; `star` is the exception and is drawn to be filled (a stroked star at 20px on a
 * coin reads as a scribble).
 */
const PATHS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trophy:
    '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/><path d="M9 17h6M10 17v-3h4v3M9 21h6"/>',
  skull:
    '<circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><path d="M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14zM10 20v2M14 20v2"/>',
  foot: '<path d="M4 16c0-3 1.5-5 3-5s2 2 2 4-1 4-3 4-2-2-2-3z"/><circle cx="14" cy="5" r="1.6"/><circle cx="18" cy="7" r="1.4"/><circle cx="19" cy="11" r="1.3"/>',
  swords: '<path d="M14.5 14.5 3 3v4l9.5 9.5M19.5 4.5 21 3M9.5 14.5 3 21v-4M14.5 9.5 21 3v4"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  heart: '<path d="M12 20s-7-4.5-9.5-9A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  book: '<path d="M3 5a2 2 0 0 1 2-2h6v17H5a2 2 0 0 0-2 2zM21 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  play: '<path d="M6 4l14 8-14 8z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sparkle:
    '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18"/>',
  rotom:
    '<path d="M12 3a5 5 0 0 0-5 5v1H5l1.5 3L5 15h2a5 5 0 0 0 10 0h2l-1.5-3L19 9h-2V8a5 5 0 0 0-5-5z"/><circle cx="9.5" cy="9" r="1"/><circle cx="14.5" cy="9" r="1"/><path d="M9 13h6"/>',
  type: '<path d="M4 7V5h16v2M9 5v14M15 19H9"/>',
  contract: '<path d="M8 3h8l4 4v14H4V3z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  egg: '<path d="M12 3c3 0 6 5 6 9a6 6 0 0 1-12 0c0-4 3-9 6-9z"/>',
  crown: '<path d="M3 8l3.5 4L12 5l5.5 7L21 8l-1.8 11H4.8z"/><path d="M4 19h16"/>',
  flag: '<path d="M5 21V4M5 4h11l-2.2 3.4L16 11H5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3.4 2.8 14.6 0 18M12 3c-2.8 3.4-2.8 14.6 0 18"/>',
  route: '<circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="5" r="2.4"/><path d="M8.4 19H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.6"/>',
  idcard:
    '<rect x="2.5" y="5" width="19" height="14" rx="2.2"/><circle cx="8" cy="11" r="2.3"/><path d="M4.6 16c.7-1.6 2-2.3 3.4-2.3s2.7.7 3.4 2.3M14 9.5h4.5M14 12.5h4.5M14 15.5h3"/>',
  plane:
    '<path d="M10 3.5c.9 0 1.5.7 1.5 1.7v4.2l8 4.7v1.9l-8-2.4v3.7l2 1.4v1.5l-3.5-1-3.5 1v-1.5l2-1.4v-3.7l-8 2.4v-1.9l8-4.7V5.2c0-1 .6-1.7 1.5-1.7z"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="M8.6 9.7 6 3h4l2.2 4.4M15.4 9.7 18 3h-4"/>',
  star: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.4l6-.8z"/>',
} as const

/** Drawn as a solid, not a stroke. */
const FILLED = new Set<IconName>(["star"])

export type IconName = keyof typeof PATHS

export interface IconProps {
  name: IconName
  /** Size is a class (`h-4 w-4`, `h-[17px] w-[17px]`) — there is no `size` prop. */
  className?: string
}

export function Icon({ name, className }: IconProps) {
  const filled = FILLED.has(name)
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("h-4 w-4 flex-none", className)}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}
