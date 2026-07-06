"use client"

import { type CSSProperties } from "react"
import { cn } from "@/lib/utils"

// Compact inline icon set used across the Schematic Compat pieces. Ported
// verbatim from the design handoff so the tool stays pixel-identical; kept local
// (rather than folded into the shared Icon) because several glyphs — cube,
// folder, upload, file, filedown — don't exist in the boffmedia Icon set.
export const SCH_ICONS: Record<string, string> = {
  cube: "M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5M12 12v10",
  folder: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  upload: "M12 16V4m0 0L7 9m5-5l5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2",
  play: "M6 4l14 8-14 8V4z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35",
  download: "M12 4v12m0 0l5-5m-5 5l-5-5M4 19h16",
  filedown: "M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6zM14 3v6h6M12 12v5m0 0l-2-2m2 2l2-2",
  layers: "M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  maximize: "M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m13-5v3a2 2 0 01-2 2h-3",
  minimize: "M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3m13-5h-3a2 2 0 00-2 2v3",
  info: "M12 16v-4m0-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
  chevron: "M6 9l6 6 6-6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.4 3.9a2 2 0 00-3.4 0z",
  x: "M6 6l12 12M18 6L6 18",
  arrow: "M5 12h14m-6-6l6 6-6 6",
  file: "M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6zM14 3v6h6",
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
  gamepad: "M6 12h4m-2-2v4m6-2h.01M18 10h.01M7 18a5 5 0 01-5-5 7 7 0 017-7h6a7 7 0 017 7 5 5 0 01-5 5c-1.5 0-2.5-1-3.5-2h-3C9 17 8 18 7 18z",
}

export interface SchIconProps {
  name: keyof typeof SCH_ICONS | string
  size?: number
  stroke?: number
  className?: string
  style?: CSSProperties
}

export function SchIcon({ name, size = 16, stroke = 2, className, style }: SchIconProps) {
  return (
    <svg
      className={cn("inline-block shrink-0", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d={SCH_ICONS[name] || ""} />
    </svg>
  )
}
