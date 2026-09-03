"use client"

import * as React from "react"
import { cn } from "../cn"

export type AvatarSize = "sm" | "md" | "lg"

export interface AvatarProps {
  /** Initials (or any glyph). Also the fallback when `src` is unset or fails. */
  children: React.ReactNode
  /** A picture. Falls back to `children` if it fails to load. */
  src?: string | null
  alt?: string
  /** 24 / 36 / 64 px. `sm` fits a 32px table row or a picker line. */
  size?: AvatarSize
  accent?: boolean
  className?: string
}

const SIZE: Record<AvatarSize, string> = {
  sm: "h-6 w-6 text-[0.625rem] [--cut:5px]",
  md: "h-9 w-9 text-[0.8125rem]",
  lg: "h-16 w-16 text-[1.375rem]",
}

export function Avatar({ children, src, alt = "", size = "md", accent, className }: AvatarProps) {
  const [broken, setBroken] = React.useState(false)
  const showImg = !!src && !broken
  return (
    <span
      className={cn(
        "inline-grid place-items-center overflow-hidden border border-solid font-display font-bold uppercase leading-none shrink-0",
        "cut-seal cut-seal-edge [--cut:8px]",
        SIZE[size],
        accent
          ? "bg-accent border-accent [--cut-line:var(--accent)] text-accent-ink"
          : "bg-panel-2 border-line-2 [--cut-line:var(--line-2)]",
        className,
      )}
    >
      {showImg ? (
        <img src={src!} alt={alt} onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        children
      )}
    </span>
  )
}

export interface AvatarGroupProps {
  items: (string | { label: string; accent?: boolean })[]
  max?: number
  size?: AvatarSize
}

export function AvatarGroup({ items, max = 5, size = "md" }: AvatarGroupProps) {
  const shown = items.slice(0, max)
  const extra = items.length - shown.length
  return (
    <span className="inline-flex [&>*]:-ml-[0.5625rem] [&>*:first-child]:ml-0">
      {shown.map((it, i) => {
        const o = typeof it === "string" ? { label: it } : it
        return (
          <Avatar key={i} size={size} accent={o.accent}>
            {o.label}
          </Avatar>
        )
      })}
      {extra > 0 && (
        <Avatar size={size} className="bg-panel font-mono font-semibold text-[0.6875rem] text-txt-muted">
          +{extra}
        </Avatar>
      )}
    </span>
  )
}
