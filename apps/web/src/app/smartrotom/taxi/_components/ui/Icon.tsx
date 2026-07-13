import type { CSSProperties } from "react"

/**
 * The taxi's icon set — inline SVG, one stroke weight, drawn on a 24×24 grid. The set
 * is part of the app's identity, so it is not `lucide-react` and must not be mixed with
 * one (SMARTROTOM_V3 §10): a stray library icon shows up instantly as a different
 * stroke weight.
 *
 * Each entry is a path string; ` M` splits it into subpaths.
 */
const PATHS = {
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z M12 10.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
  sort: "M7 4v16 M7 4 4 7 M7 4l3 3 M17 20V4 M17 20l3-3 M17 20l-3-3",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2",
  coins: "M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z M15.5 8.5a6 6 0 1 1-6.9 9.4",
  nav: "M3 11l18-8-8 18-2-8-8-2Z",
  x: "M18 6 6 18 M6 6l12 12",
  crosshair:
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  check: "M20 6 9 17l-5-5",
  wallet: "M19 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z M3 9V7a2 2 0 0 1 2-2h11 M17 13h.01",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M8 17h6a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h3",
  arrowR: "M5 12h14 M13 6l6 6-6 6",
  arrowDown: "M12 5v14 M6 13l6 6 6-6",
  spark: "M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 3Z",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5Z",
  walking: "M13 4.5a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z M9 21l2.5-5 1.5-2 1 4 3 3 M7 11l3-2 3 1 2 3",
  users:
    "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19 M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4 M15 4.2a3.5 3.5 0 0 1 0 6.6",
  trophy:
    "M8 4h8v5a4 4 0 0 1-8 0V4Z M8 6H5v2a3 3 0 0 0 3 3 M16 6h3v2a3 3 0 0 1-3 3 M9.5 14.5 9 18h6l-.5-3.5 M8 21h8 M10 18v3 M14 18v3",
  flame: "M12 3c1 3 4 4.2 4 8a4 4 0 0 1-8 0c0-1.4.6-2.4 1.3-3.2C9.8 6.6 11 5.5 12 3Z M11 18.5a2 2 0 1 0 2 0",
  gift: "M20 12v8H4v-8 M2 8h20v4H2V8Z M12 8v12 M12 8S10.5 4 8 4a2 2 0 0 0 0 4h4 M12 8s1.5-4 4-4a2 2 0 0 1 0 4h-4",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21 8.2 15.3 8.2 12 9.5 5.6 12 3Z",
  map: "M9 4 3 7v13l6-3 6 3 6-3V4l-6 3-6-3Z M9 4v13 M15 7v13",
  lock: "M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z M8 11V8a4 4 0 0 1 8 0v3",
  bell: "M18 8a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14 18 8Z M10.5 19a2 2 0 0 0 3 0",
  calendar: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M4 9h16 M8 3v4 M16 3v4",
  plusCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 8v8 M8 12h8",
  swords: "M14.5 4H20v5.5L9.5 20H4v-5.5L14.5 4Z M14 8l2 2 M5 14l5 5 M19 5l-2 2",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z M7.5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  partyPop: "M3 21l4.5-12L17 18.5 3 21Z M14 3v2 M19 8h2 M16.5 4.5l1.4-1.4 M14 9c1.5-1.5 4-1.5 5.5 0 M10 5c1 1 1 2.5 0 3.5",
  skull:
    "M12 3a8 8 0 0 0-5 14.3V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.7A8 8 0 0 0 12 3Z M9 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3 M15 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3 M10 21v-2 M14 21v-2",
  anchor:
    "M12 8a2.2 2.2 0 1 0 0-4.4A2.2 2.2 0 0 0 12 8Z M12 8v13 M5 13a7 7 0 0 0 14 0 M3 13h2 M19 13h2 M12 21c-3.5 0-6.3-2.4-7-5.6 M12 21c3.5 0 6.3-2.4 7-5.6",
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 22,
  stroke = 2,
  className,
  style,
}: {
  name: IconName
  size?: number
  stroke?: number
  className?: string
  style?: CSSProperties
}) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  )
}
