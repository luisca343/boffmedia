import * as React from "react"
import { cn } from "../cn"

const ICONS = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  back: <path d="M20 12H5m6 6-6-6 6-6" />,
  home: <path d="M4 11 12 4l8 7v9h-5v-6h-6v6H4z" />,
  search: <g><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" /></g>,
  bell: <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6m4 9a2.2 2.2 0 0 0 4 0" />,
  user: <g><circle cx="12" cy="8" r="4" /><path d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6" /></g>,
  users: <g><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.4 3.4-5 6.5-5s5.5 1.6 6.5 5M16 3.8a3.5 3.5 0 0 1 0 8.4M18.5 15.2c2 .8 3 2.4 3.5 4.8" /></g>,
  sun: <g><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></g>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5" />,
  gamepad: <g><path d="M6 9h12a4 4 0 0 1 4 4v3a3 3 0 0 1-5.5 1.7L15 16H9l-1.5 1.7A3 3 0 0 1 2 16v-3a4 4 0 0 1 4-4Z" /><path d="M8 11.5v3M6.5 13h3" /><circle cx="16" cy="12" r="0.8" /><circle cx="18.5" cy="14" r="0.8" /></g>,
  // System glyphs for the multi-game rail (cube + skull already exist below).
  // Original line drawings on purpose: real console logos are trademarks, and
  // strokes tint via currentColor.
  handheld: <g><rect x="2.5" y="6.5" width="19" height="11" rx="3.5" /><rect x="9.5" y="9" width="5" height="6" /><path d="M5.75 10.5v3M4.25 12h3" /><circle cx="18" cy="10.5" r="0.8" /><circle cx="18" cy="13.5" r="0.8" /></g>,
  dualscreen: <g><rect x="5" y="3.5" width="14" height="8" rx="1.5" /><rect x="5" y="13" width="14" height="7.5" rx="1.5" /><rect x="7.5" y="5.5" width="9" height="4" /><path d="M9.5 16.5v2M8.5 17.5h2" /><circle cx="15.5" cy="17.5" r="0.6" /></g>,
  trophy: <g><path d="M8 4h8v6a4 4 0 0 1-8 0zM8 5H4.5c0 4 1.5 5.5 3.5 5.5M16 5h3.5c0 4-1.5 5.5-3.5 5.5" /><path d="M12 14v3m-4 4c.5-2.5 2-4 4-4s3.5 1.5 4 4z" /></g>,
  calc: <g><rect x="5" y="3" width="14" height="18" /><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" /></g>,
  sword: <path d="m4 20 4-1 11-11-3-3L5 16zm10-15 5 5M3 21l2-2" />,
  tree: <path d="M12 3v18M12 8l5-3M12 8 7 5m5 8 6-3m-6 3-6-3m6 8 4-2m-4 2-4-2" />,
  chart: <path d="M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3" />,
  trending: <path d="m3 17 6-6 4 4 8-8m0 0h-5m5 0v5" />,
  cards: <g><rect x="3" y="5" width="10" height="14" /><path d="M15 5.5 20 7l-3.5 12-3-.9" /></g>,
  mail: <g><rect x="3" y="5" width="18" height="14" /><path d="m3 7 9 6 9-6" /></g>,
  calendar: <g><rect x="4" y="5" width="16" height="16" /><path d="M4 10h16M9 3v4m6-4v4" /></g>,
  wrench: <path d="M14.5 6.5a4.5 4.5 0 0 0-6 5.5L3 17.5V21h3.5L12 15.5a4.5 4.5 0 0 0 5.5-6L14 13l-3-3z" />,
  shield: <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />,
  settings: <g><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.3 6.5l2.6 1.5M17.1 16l2.6 1.5M4.3 17.5l2.6-1.5M17.1 8l2.6-1.5" /></g>,
  bolt: <path d="M13 2 5 13h5l-1 9 8-11h-5z" />,
  flame: <path d="M12 3c1 3-3 5-3 9a3 3 0 0 0 6 0c0-1.5-.8-2.6-.8-2.6C17 10.5 18 12.5 18 15a6 6 0 0 1-12 0c0-6 5-8 6-12z" />,
  target: <g><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" /></g>,
  star: <path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.6l1.1-6L3.4 9.4l6-.8z" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  x: <path d="m5 5 14 14m0-14L5 19" />,
  plus: <path d="M12 4v16M4 12h16" />,
  minus: <path d="M4 12h16" />,
  edit: <path d="M4 20h4L20 8l-4-4L4 16zm10-14 4 4" />,
  trash: <path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v6m4-6v6" />,
  eye: <g><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></g>,
  link: <path d="M10 14a4 4 0 0 0 6 .4l3-3a4 4 0 1 0-5.7-5.6L11.6 7.5M14 10a4 4 0 0 0-6-.4l-3 3a4 4 0 1 0 5.7 5.6l1.7-1.7" />,
  copy: <g><rect x="9" y="9" width="12" height="12" /><path d="M5 15H3V3h12v2" /></g>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  collapse: <path d="m11 7-5 5 5 5m7-10-5 5 5 5" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  grid: <g><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></g>,
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
  clock: <g><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></g>,
  info: <g><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5m0-8.5v.01" /></g>,
  alert: <path d="M12 3 2.5 20h19zM12 10v4m0 3v.01" />,
  axe: <path d="m9 8 7 7M14 4c2 1 5 4 5 8-2.5-1-5 0-6.5 1.5L8 9C9.5 7.5 11 5 10 2.5c1.5 0 3 .8 4 1.5zM8.5 9.5 3 15l5 5 5.5-5.5" />,
  puzzle: <path d="M9 4h6v4a2 2 0 1 1 0 4h4v8h-5a2 2 0 1 0-4 0H5v-5a2 2 0 1 1 0-4V7h4z" />,
  play: <path d="M7 4.5v15l13-7.5z" />,
  download: <path d="M12 4v11m-5-4 5 5 5-5M4 20h16" />,
  external: <path d="M14 4h6v6m0-6L10 14M9 5H4v15h15v-5" />,
  key: <g><circle cx="8" cy="15" r="4.5" /><path d="m11.5 11.5 8-8M17 6l3 3m-6 0 2.5 2.5" /></g>,
  gift: <g><rect x="4" y="9" width="16" height="12" /><path d="M12 9v12M4 13h16M7 9c-2 0-2.8-4 0-4 2.5 0 4 2 5 4 1-2 2.5-4 5-4 2.8 0 2 4 0 4z" /></g>,
  hammer: <path d="m13 6 5 5-1.5 1.5-5-5zM4 20l7.5-7.5M14 5l-2 2 1 1c1-1.5 3-2 4.5-1L19 5.5C17.5 3.5 15 4 14 5z" />,
  zap: <path d="M13 2 5 13h5l-1 9 8-11h-5z" />,
  database: <g><ellipse cx="12" cy="5.5" rx="7.5" ry="3" /><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" /></g>,
  layers: <path d="M12 3 3 8l9 5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />,
  sliders: <path d="M4 8h9m3 0h4M4 16h4m3 0h9M14 6v4M9 14v4" />,
  cog: <g><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.3 6.5l2.6 1.5M17.1 16l2.6 1.5M4.3 17.5l2.6-1.5M17.1 8l2.6-1.5" /></g>,
  refresh: <path d="M20 11a8 8 0 0 0-14-4.5L4 8m0-4v4h4m-8 5a8 8 0 0 0 14 4.5L20 16m0 4v-4h-4" />,
  book: <path d="M4 4.5A2 2 0 0 1 6 3h13v15H6a2 2 0 0 0-2 2zM4 20.5A2 2 0 0 1 6 18.5h13" />,
  globe: <g><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.4 3.8 8.5S14.5 18.6 12 21c-2.5-2.4-3.8-5.4-3.8-8.5S9.5 5.9 12 3.5Z" /></g>,
  message: <path d="M4 5h16v11H9l-5 4z" />,
  swatch: <g><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><path d="M13 20a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0" /></g>,
  sparkles: <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3zM18 14l.9 2.3L21 17l-2.1.7L18 20l-.9-2.3L15 17l2.1-.7z" />,
  inbox: <path d="M4 13l2.5-8h11L20 13v6H4zM4 13h5l1.5 2.5h3L15 13h5" />,
  code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5M13.5 4l-3 16" />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  lock: <g><rect x="5" y="11" width="14" height="9" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></g>,
  heart: <path d="M12 21C5.5 16.5 3 12.5 3 9a4 4 0 0 1 7.5-2A4 4 0 0 1 21 9c0 3.5-2.5 7.5-9 12z" />,
  reply: <path d="M9 7 4 12l5 5m-5-5h10a6 6 0 0 1 6 6v1" />,
  paw: <g><ellipse cx="12" cy="15.5" rx="4.5" ry="3.5" /><circle cx="6.5" cy="9.5" r="1.8" /><circle cx="10" cy="6.5" r="1.8" /><circle cx="14" cy="6.5" r="1.8" /><circle cx="17.5" cy="9.5" r="1.8" /></g>,
  drop: <path d="M12 3c3.5 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6 6-11z" />,
  crosshair: <g><circle cx="12" cy="12" r="8" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></g>,
  map: <path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" />,
  skull: <g><path d="M5 10a7 7 0 0 1 14 0v4l-1.5 1.5V19H6.5v-3.5L5 14z" /><circle cx="9" cy="11" r="1.4" /><circle cx="15" cy="11" r="1.4" /><path d="M12 14v2" /></g>,
  chain: <path d="M9 12h6M8.5 8H7a4 4 0 0 0 0 8h1.5m7-8H17a4 4 0 0 1 0 8h-1.5" />,
  compass: <g><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></g>,
  dice: <g><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1" /><circle cx="15" cy="9" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="9" cy="15" r="1" /><circle cx="15" cy="15" r="1" /></g>,
  discord: <g><path d="M8.4 6.6c-2 .3-3.6 1-4.4 1.8-1.3 2.3-1.8 5-1.5 7.6 1.4 1.1 2.9 1.9 4.6 2.2l.9-1.5M15.6 6.6c2 .3 3.6 1 4.4 1.8 1.3 2.3 1.8 5 1.5 7.6-1.4 1.1-2.9 1.9-4.6 2.2l-.9-1.5M7 16.8c3.2 1.5 6.8 1.5 10 0M8.4 6.6C10.7 6.1 13.3 6.1 15.6 6.6" /><circle cx="9" cy="12.4" r="1.25" /><circle cx="15" cy="12.4" r="1.25" /></g>,
  google: <g><path d="M21.4 12.3c0 5-3.5 8.7-9.4 8.7a9 9 0 1 1 6.2-15.5" /><path d="M21.4 12.3H12" /></g>,
  steam: <g><circle cx="12" cy="12" r="9" /><circle cx="15.6" cy="8.6" r="2.4" /><circle cx="8.1" cy="14.9" r="1.7" /><path d="m9.6 13.9 4.1-2.9" /></g>,
  twitch: <g><path d="M4 3 3 6v11h4v3l3-3h4l5-5V3z" /><path d="M11 7v5M15 7v5" /></g>,
  camera: <g><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H8l1.4-2.2h5.2L16 7h3.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" /><circle cx="12" cy="13" r="3.4" /></g>,
  logout: <g><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" /><path d="m10 8-4 4 4 4M6 12h9" /></g>,
  fullscreen: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  exitFullscreen: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  pause: <path d="M8 5v14M16 5v14" />,
  swap: <path d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8" />,
  cube: <path d="M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5M12 12v10" />,
  folder: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  upload: <path d="M12 16V4m0 0L7 9m5-5l5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />,
  server: <g><rect x="4" y="4" width="16" height="7" rx="1" /><rect x="4" y="13" width="16" height="7" rx="1" /><path d="M7.5 7.5h.01M7.5 16.5h.01" /></g>,
  more: <g><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></g>,
} satisfies Record<string, React.ReactNode>

/** Every valid icon name — use this to type icon fields so typos fail at compile time. */
export type IconName = keyof typeof ICONS

export interface IconProps {
  name: IconName
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 18, className, style }: IconProps) {
  return (
    <svg
      className={cn("shrink-0", className)}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.info}
    </svg>
  )
}

export const ICON_NAMES = Object.keys(ICONS)
