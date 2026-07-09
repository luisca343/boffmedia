"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { LZ_GENRE_ICON, LZ_PLATFORMS, type LzPlatformKey } from "./calendar-util"

// The per-release atoms: wish star, platform pills, hype meter, versions list and
// the striped box-art placeholder. Prefix lz- in calendario.css.

export function LzWishStar({ on, onToggle, size = 18, label = "Seguir lanzamiento" }: { on?: boolean; onToggle?: (next: boolean) => void; size?: number; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Dejar de seguir" : label}
      title={on ? "Siguiendo" : label}
      onClick={(e) => {
        e.stopPropagation()
        onToggle && onToggle(!on)
      }}
      className={cn("grid h-[30px] w-[30px] place-items-center border-0 bg-transparent transition-[color,transform] duration-[140ms] hover:scale-[1.12] hover:text-warn", on ? "text-warn" : "text-txt-dim")}
    >
      <Icon name="star" size={size} className={on ? "fill-current" : undefined} />
    </button>
  )
}

export function LzPlatformPills({ platforms = [], color = true, compact = false, max }: { platforms?: LzPlatformKey[]; color?: boolean; compact?: boolean; max?: number }) {
  const list = max ? platforms.slice(0, max) : platforms
  const extra = max ? platforms.length - list.length : 0
  const pad = compact ? "px-[5px] py-[3px] text-[9px]" : "px-[7px] py-1 text-[10px]"
  return (
    <span className="inline-flex flex-wrap gap-[5px]">
      {list.map((p) => {
        const meta = LZ_PLATFORMS[p]
        if (!meta) return null
        return (
          <span
            key={p}
            title={meta.label}
            style={color ? ({ "--ph": meta.color } as React.CSSProperties) : undefined}
            className={cn(
              "border border-solid font-mono font-semibold uppercase leading-none tracking-[0.06em]",
              pad,
              color ? "border-[color-mix(in_oklab,var(--ph)_45%,transparent)] bg-[color-mix(in_oklab,var(--ph)_10%,transparent)] text-[color:var(--ph)]" : "border-line-2 text-txt-muted",
            )}
          >
            {compact ? meta.short : meta.label}
          </span>
        )
      })}
      {extra > 0 && <span className={cn("border border-dashed border-line-2 font-mono font-semibold uppercase leading-none tracking-[0.06em] text-txt-dim", pad)}>+{extra}</span>}
    </span>
  )
}

const HYPE_LABELS: Record<number, string> = { 5: "Imprescindible", 4: "Muy esperado", 3: "En el radar", 2: "Discreto", 1: "Nicho" }

export function LzHypeMeter({ value = 0, showLabel = false }: { value?: number; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" title={"Expectación: " + value + "/5"}>
      <span aria-hidden className="inline-flex items-end gap-[3px]">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ "--ti": i } as React.CSSProperties} className={cn("w-1 h-[calc(6px_+_var(--ti)_*_1.6px)]", i <= value ? "bg-accent" : "bg-line-2")} />
        ))}
      </span>
      {showLabel && <span className="font-mono text-[10px]/none font-semibold uppercase tracking-[0.08em] text-txt-muted">{HYPE_LABELS[value] || ""}</span>}
    </span>
  )
}

export function LzVersList({ platforms = [], max = 4, icon = false }: { platforms?: LzPlatformKey[]; max?: number; icon?: boolean }) {
  const shown = platforms.slice(0, max)
  const extra = platforms.length - shown.length
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-[5px] font-mono text-[11px]/[1.3] font-semibold">
      {icon && <Icon name="gamepad" size={13} className="flex-none text-txt-dim" />}
      {shown.map((p, i) => {
        const meta = LZ_PLATFORMS[p]
        if (!meta) return null
        return (
          <React.Fragment key={p}>
            {i > 0 && (
              <span aria-hidden className="text-line-2">
                /
              </span>
            )}
            <span style={{ "--ph": meta.color } as React.CSSProperties} className="tracking-[0.01em] text-[color:color-mix(in_oklab,var(--ph)_78%,var(--text))]">
              {meta.label}
            </span>
          </React.Fragment>
        )
      })}
      {extra > 0 && <span className="text-txt-dim">+{extra}</span>}
    </span>
  )
}

// Striped box-art placeholder with a genre glyph. [deferred] real Catálogo cover
// art (CtCover) isn't available locally yet. `className` sets the container size.
export function LzCover({ genre, size = 22, className = "w-[52px]" }: { genre: string; size?: number; className?: string }) {
  const gi = LZ_GENRE_ICON[genre] || "gamepad"
  return (
    <span aria-hidden className={cn("relative grid aspect-[3/4] flex-none place-items-center self-start overflow-hidden border border-solid border-line text-txt-dim transition-[border-color] duration-[140ms] [background:repeating-linear-gradient(135deg,var(--bg-2)_0_6px,var(--panel-2)_6px_12px)]", className)}>
      <Icon name={gi} size={size} />
    </span>
  )
}
