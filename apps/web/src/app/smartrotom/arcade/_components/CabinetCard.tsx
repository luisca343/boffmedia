"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { ArcadeGame, GameAccent } from "../_data/games"
import { Corners, Icon, PixelArt, Tag } from "./ui"

export interface CabinetCardProps {
  game: ArcadeGame
  compact?: boolean
}

// The accent drives the whole cabinet — marquee strip, CRT bloom, sprite glow,
// the JUGAR chevron. Full literal classes, never `text-${accent}` (§4, gap G2).
const ACCENT: Record<GameAccent, { text: string; strip: string; border: string; hover: string; crt: string }> = {
  cyan: {
    text: "text-ar-cyan",
    strip: "bg-[linear-gradient(180deg,rgb(var(--ar-cyan)/.13),transparent)]",
    border: "border-b-ar-cyan/[.33]",
    hover: "hover:shadow-[0_24px_60px_-16px_rgb(var(--ar-cyan)/.45),inset_0_0_0_1px_rgb(var(--ar-cyan))]",
    crt: "bg-[radial-gradient(120%_80%_at_50%_0%,rgb(var(--ar-cyan)/.19),transparent_70%)]",
  },
  magenta: {
    text: "text-ar-magenta-2",
    strip: "bg-[linear-gradient(180deg,rgb(var(--ar-magenta)/.13),transparent)]",
    border: "border-b-ar-magenta/[.33]",
    hover:
      "hover:shadow-[0_24px_60px_-16px_rgb(var(--ar-magenta)/.45),inset_0_0_0_1px_rgb(var(--ar-magenta-2))]",
    crt: "bg-[radial-gradient(120%_80%_at_50%_0%,rgb(var(--ar-magenta)/.19),transparent_70%)]",
  },
  violet: {
    text: "text-ar-violet-2",
    strip: "bg-[linear-gradient(180deg,rgb(var(--ar-violet)/.13),transparent)]",
    border: "border-b-ar-violet/[.33]",
    hover:
      "hover:shadow-[0_24px_60px_-16px_rgb(var(--ar-violet)/.5),inset_0_0_0_1px_rgb(var(--ar-violet-2))]",
    crt: "bg-[radial-gradient(120%_80%_at_50%_0%,rgb(var(--ar-violet)/.19),transparent_70%)]",
  },
  amber: {
    text: "text-ar-amber",
    strip: "bg-[linear-gradient(180deg,rgb(var(--ar-amber)/.13),transparent)]",
    border: "border-b-ar-amber/[.33]",
    hover: "hover:shadow-[0_24px_60px_-16px_rgb(var(--ar-amber)/.5),inset_0_0_0_1px_rgb(var(--ar-amber))]",
    crt: "bg-[radial-gradient(120%_80%_at_50%_0%,rgb(var(--ar-amber)/.19),transparent_70%)]",
  },
  lime: {
    text: "text-ar-lime",
    strip: "bg-[linear-gradient(180deg,rgb(var(--ar-lime)/.13),transparent)]",
    border: "border-b-ar-lime/[.33]",
    hover: "hover:shadow-[0_24px_60px_-16px_rgb(var(--ar-lime)/.45),inset_0_0_0_1px_rgb(var(--ar-lime))]",
    crt: "bg-[radial-gradient(120%_80%_at_50%_0%,rgb(var(--ar-lime)/.19),transparent_70%)]",
  },
}

const SPRITE_GLOW: Record<GameAccent, { idle: string; hot: string }> = {
  cyan: { idle: "drop-shadow(0 0 4px rgba(0,229,255,.4))", hot: "drop-shadow(0 0 8px #00e5ff) drop-shadow(0 0 16px #00e5ff)" },
  magenta: { idle: "drop-shadow(0 0 4px rgba(255,46,147,.4))", hot: "drop-shadow(0 0 8px #ff2e93) drop-shadow(0 0 16px #ff2e93)" },
  violet: { idle: "drop-shadow(0 0 4px rgba(168,85,255,.4))", hot: "drop-shadow(0 0 8px #a855ff) drop-shadow(0 0 16px #a855ff)" },
  amber: { idle: "drop-shadow(0 0 4px rgba(255,184,69,.4))", hot: "drop-shadow(0 0 8px #ffb845) drop-shadow(0 0 16px #ffb845)" },
  lime: { idle: "drop-shadow(0 0 4px rgba(122,248,202,.4))", hot: "drop-shadow(0 0 8px #7af8ca) drop-shadow(0 0 16px #7af8ca)" },
}

/**
 * A game as an arcade cabinet: marquee strip on top, a CRT showing the sprite,
 * the control panel below. The whole card is the link — the hover state lights
 * the machine up.
 */
export function CabinetCard({ game, compact }: CabinetCardProps) {
  const [hot, setHot] = useState(false)
  const accent = ACCENT[game.accent]
  const glow = SPRITE_GLOW[game.accent]

  return (
    <Link
      href={game.href}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      className={cn(
        "group relative block overflow-hidden rounded-[14px] border border-white/[.08]",
        "bg-[linear-gradient(180deg,#1a0e3d_0%,#0c0628_100%)]",
        "shadow-[0_10px_32px_-16px_rgb(0_0_0/.7),inset_0_0_0_1px_rgb(255_255_255/.04)]",
        "transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] focus-visible:-translate-y-[3px]",
        accent.hover,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3.5 pb-2 pt-2.5",
          accent.strip,
          accent.border,
        )}
      >
        <span
          className={cn("font-ar-display text-[9px] uppercase tracking-[0.18em]", accent.text)}
        >
          ▸ {game.category}
        </span>
        {game.badge && <Tag tone={game.badge.tone}>{game.badge.label}</Tag>}
      </div>

      <div
        className={cn(
          "ar-scanlines grid place-items-center border-b border-white/[.05] bg-ar-void",
          compact ? "h-[130px]" : "h-[180px]",
        )}
      >
        <div aria-hidden className={cn("absolute inset-0", accent.crt)} />
        <Corners tone={game.accent} inset={6} size={10} thick={1} />
        <div
          className={cn(
            "relative transition-transform duration-[250ms]",
            "group-hover:-translate-y-1 group-hover:scale-[1.06]",
            "group-focus-visible:-translate-y-1 group-focus-visible:scale-[1.06]",
          )}
        >
          <PixelArt
            sprite={game.art}
            scale={compact ? 5 : 6}
            style={{ filter: hot ? glow.hot : glow.idle }}
          />
        </div>
        <div className="absolute inset-x-2.5 bottom-2 flex items-end justify-between">
          <span
            className={cn(
              "font-ar-display text-ar-ink",
              compact ? "text-[11px]" : "text-[13px]",
              hot && "ar-chrom",
            )}
          >
            {game.title}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-3">
        <p className="m-0 min-h-8 font-ar text-xs leading-relaxed text-ar-ink-dim">{game.tagline}</p>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "font-ar-display text-[9px] tracking-[0.16em]",
              hot
                ? "text-ar-amber motion-reduce:animate-none animate-ar-blink"
                : "text-ar-ink-muted",
            )}
          >
            INSERT COIN ●
          </span>
          <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", accent.text)}>
            JUGAR <Icon.Chevron s={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}
