"use client"

import * as React from "react"
import { Icon } from "../primitives/icon"
import { BoffBadge as Badge } from "../primitives/badge"
import { FavStar } from "./fav-star"
import { useRecent } from "./tools-store"

interface ToolTileTool {
  title: string
  name?: string
  desc: string
  icon: string
  href: string
  cat?: string
  hue?: number
  isNew?: boolean
  soon?: boolean
  status?: string
  popularity?: string
  features?: string[]
}

interface ToolTileGame {
  short: string
  hue: number
}

interface ToolTileProps {
  tool: ToolTileTool
  game?: ToolTileGame
  go: (path: string) => void
  showGame?: boolean
  className?: string
}

export function ToolTile({ tool, game, go, showGame = false, className = "" }: ToolTileProps) {
  const { push } = useRecent()
  const disabled = tool.soon
  const hue = game?.hue ?? tool.hue ?? 28

  const open = () => {
    if (disabled) return
    push(tool.href)
    go(tool.href.replace(/^#/, ""))
  }

  return (
    <div
      className={
        "flex items-start gap-[0.9rem] p-[1.1rem] cursor-pointer rounded-[var(--radius-lg)] bg-[var(--card-bg)] border border-[var(--border)] transition-all duration-[var(--dur)]" +
        (disabled
          ? " opacity-60 cursor-default"
          : " hover:border-[color-mix(in_srgb,var(--orange-500)_45%,var(--border))] hover:-translate-y-[2px] hover:shadow-[var(--card-shadow-hover)]") +
        (className ? " " + className : "")
      }
      style={{ "--hue": `${hue}deg` } as React.CSSProperties}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open()
      }}
    >
      <span
        className="w-[42px] h-[42px] shrink-0 rounded-[var(--radius)] grid place-items-center border"
        style={{
          color: `oklch(0.85 0.12 ${hue})`,
          background: `oklch(0.5 0.12 ${hue} / 0.16)`,
          borderColor: `oklch(0.6 0.14 ${hue} / 0.4)`,
        }}
      >
        <Icon name={tool.icon} size={20} />
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-[0.3rem]">
        <div className="flex items-center gap-[0.45rem] flex-wrap">
          <span className="font-bold text-[length:var(--t-base)]">{tool.title}</span>
          {tool.isNew && <Badge kind="new">Nuevo</Badge>}
          {tool.soon && <Badge kind="soon">Pronto</Badge>}
        </div>
        <span className="text-[length:var(--t-xs)] text-[color:var(--text-muted)] leading-[1.5] line-clamp-2 m-0">
          {tool.desc}
        </span>
        <div className="flex items-center gap-[0.6rem] mt-[0.2rem]">
          {showGame && game && (
            <span className="font-mono text-[0.62rem] tracking-[0.08em] uppercase text-[color:var(--text-dim)] px-2 py-[0.15rem] rounded-[var(--radius-pill)] bg-[var(--surface-2)]">
              {game.short}
            </span>
          )}
          {!showGame && tool.cat && (
            <span className="font-mono text-[0.62rem] tracking-[0.08em] uppercase text-[color:var(--text-dim)] px-2 py-[0.15rem] rounded-[var(--radius-pill)] bg-[var(--surface-2)]">
              {tool.cat}
            </span>
          )}
          {tool.popularity === "high" && (
            <span className="inline-flex items-center gap-[0.3rem] text-[length:var(--t-xs)] text-[color:var(--orange-500)]">
              <Icon name="trending" size={12} /> Popular
            </span>
          )}
        </div>
      </div>
      <FavStar href={tool.href} />
    </div>
  )
}
