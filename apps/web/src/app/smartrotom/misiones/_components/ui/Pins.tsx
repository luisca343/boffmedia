"use client"

import { useId } from "react"

/** Iron nail — what holds down a paper nobody is working on. */
export function Nail({ size = 14, color = "#3a2a18", className }: { size?: number; color?: string; className?: string }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      style={{ filter: "drop-shadow(1px 2px 2px rgba(0,0,0,.5))" }}
    >
      <defs>
        <radialGradient id={id} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#c0a070" />
          <stop offset="40%" stopColor="#8a6840" />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="8" fill={`url(#${id})`} stroke="rgba(0,0,0,.5)" strokeWidth="0.5" />
      <ellipse cx="9.5" cy="8.5" rx="3" ry="1.2" fill="rgba(255,255,255,.4)" transform="rotate(-30 9.5 8.5)" />
      <circle cx="12" cy="12" r="1" fill="rgba(0,0,0,.45)" />
    </svg>
  )
}

/**
 * Thumbtack — a gold one pins the quest you are on, a red one pins one you
 * could take. Colour is passed in (data-driven), never built into a class.
 */
export function Thumbtack({ size = 16, color = "#a82a18", className }: { size?: number; color?: string; className?: string }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      style={{ filter: "drop-shadow(1px 3px 3px rgba(0,0,0,.5))" }}
    >
      <defs>
        <radialGradient id={id} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${id})`} stroke="rgba(0,0,0,.4)" strokeWidth="0.4" />
      <ellipse cx="9" cy="8" rx="3.5" ry="1.5" fill="rgba(255,255,255,.5)" transform="rotate(-30 9 8)" />
    </svg>
  )
}

export const TACK_GOLD = "#c89026"
export const TACK_RED = "#a82a18"
