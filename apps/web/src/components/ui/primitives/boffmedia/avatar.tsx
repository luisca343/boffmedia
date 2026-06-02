"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffAvatarProps {
  src?: string
  fallback?: string
  size?: number
  ring?: boolean
  tone?: "orange" | "accent" | "purple" | "muted"
  alt?: string
  className?: string
  style?: React.CSSProperties
}

export function BoffAvatar({ src, fallback, size = 40, ring, tone = "orange", alt = "", className, style }: BoffAvatarProps) {
  const [err, setErr] = React.useState(false)
  return (
    <span className={cn("k-avatar", `k-avatar--${tone}`, className)} data-ring={ring ? "" : undefined} style={{ width: size, height: size, ...style }}>
      {src && !err ? <img src={src} alt={alt} onError={() => setErr(true)} /> : <span className="k-avatar__fb" style={{ fontSize: size * 0.38 }}>{fallback}</span>}
    </span>
  )
}

interface BoffAvatarGroupProps {
  items: (BoffAvatarProps & { key?: string })[]
  size?: number
  max?: number
}

export function BoffAvatarGroup({ items, size = 36, max = 4 }: BoffAvatarGroupProps) {
  const shown = items.slice(0, max)
  const extra = items.length - shown.length
  return (
    <div className="k-avgroup" style={{ "--av-size": `${size}px` } as React.CSSProperties}>
      {shown.map((it, i) => <BoffAvatar key={i} {...it} size={size} />)}
      {extra > 0 && <span className="k-avatar k-avatar--muted" style={{ width: size, height: size }}><span className="k-avatar__fb" style={{ fontSize: size * 0.34 }}>+{extra}</span></span>}
    </div>
  )
}
