"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"

interface GameData {
  slug: string
  name: string
  short: string
  hue: number
  logoLabel: string
}

interface GameSwitcherProps {
  game: GameData
  go: (path: string) => void
  games?: GameData[]
  compact?: boolean
  className?: string
}

export function GameSwitcher({ game, go, games = [], compact = false, className = "" }: GameSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className={"relative " + className}>
      <button
        className="inline-flex items-center gap-[0.55rem] px-[0.7rem] py-[0.4rem] border border-[var(--border)] rounded-[var(--radius)] shrink-0 cursor-pointer bg-transparent transition-all duration-[var(--dur)] hover:bg-[var(--surface-2)]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className="w-[32px] h-[32px] rounded-[var(--radius)] grid place-items-center font-display font-extrabold text-[0.56rem]"
          style={{
            color: `oklch(0.85 0.12 ${game.hue})`,
            background: `oklch(0.5 0.12 ${game.hue} / 0.16)`,
          }}
        >
          {game.logoLabel}
        </span>
        {!compact && (
          <span className="text-[length:var(--t-sm)] font-medium text-[color:var(--text)]">
            {game.short}
          </span>
        )}
        <Icon name="chevron" size={15} className="text-[color:var(--text-dim)]" />
      </button>

      {open && games.length > 0 && (
        <div
          className="absolute top-full left-0 mt-1 min-w-[200px] z-[80] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] py-1"
          role="listbox"
        >
          <div className="font-mono text-[0.62rem] tracking-[0.1em] uppercase text-[color:var(--text-dim)] px-3 py-2">
            Cambiar de juego
          </div>
          {games.map((g) => (
            <button
              key={g.slug}
              className={
                "flex items-center gap-[0.6rem] w-full text-left px-3 py-[0.55rem] border-0 bg-transparent cursor-pointer text-[length:var(--t-sm)] transition-[background,color] duration-[var(--dur)]" +
                (g.slug === game.slug
                  ? " text-[color:var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)]"
                  : " text-[color:var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[color:var(--text)]")
              }
              role="option"
              aria-selected={g.slug === game.slug}
              onClick={() => {
                setOpen(false)
                go(`/herramientas/${g.slug}`)
              }}
            >
              <span
                className="w-[26px] h-[26px] rounded-[5px] grid place-items-center font-display font-bold text-[0.5rem] shrink-0"
                style={{
                  color: `oklch(0.85 0.12 ${g.hue})`,
                  background: `oklch(0.5 0.12 ${g.hue} / 0.16)`,
                }}
              >
                {g.logoLabel}
              </span>
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
