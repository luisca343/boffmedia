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

const toneStyles: Record<string, string> = {
  orange: "bg-[linear-gradient(135deg,var(--orange-500),var(--orange-700))]",
  accent: "bg-[linear-gradient(135deg,var(--secondary),var(--secondary-hover))] text-[var(--on-secondary)]",
  purple: "bg-[linear-gradient(135deg,var(--purple-500),var(--purple-600))]",
  muted: "bg-layer-3 text-ink-muted border border-solid border-edge-strong",
}

export function BoffAvatar({ src, fallback, size = 40, ring, tone = "orange", alt = "", className, style }: BoffAvatarProps) {
  const [err, setErr] = React.useState(false)
  return (
    <span
      className={cn(
        "relative inline-grid place-items-center rounded-full overflow-hidden shrink-0 text-white",
        "data-[direction=hud]:rounded-[var(--radius,14px)]",
        toneStyles[tone],
        ring && "shadow-[0_0_0_2px_var(--bg),0_0_0_4px_var(--secondary)]",
        className,
      )}
      style={{ width: size, height: size, ...style }}
    >
      {src && !err ? <img className="w-full h-full object-cover" src={src} alt={alt} onError={() => setErr(true)} /> : <span className="font-display font-extrabold leading-none" style={{ fontSize: size * 0.38 }}>{fallback}</span>}
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
    <div className="inline-flex [&>*]:ml-[calc(var(--av-size,36px)*-0.32)] [&>*]:border-2 [&>*]:border-solid [&>*]:border-[var(--layer-1)] [&>*:first-child]:ml-0" style={{ "--av-size": `${size}px` } as React.CSSProperties}>
      {shown.map((it, i) => <BoffAvatar key={i} {...it} size={size} />)}
      {extra > 0 && (
        <span className={cn("inline-grid place-items-center rounded-full overflow-hidden shrink-0", toneStyles.muted)} style={{ width: size, height: size }}>
          <span className="font-display font-extrabold leading-none" style={{ fontSize: size * 0.34 }}>+{extra}</span>
        </span>
      )}
    </div>
  )
}
