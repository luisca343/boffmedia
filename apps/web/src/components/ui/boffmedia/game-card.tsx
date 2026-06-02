"use client"

import { cn } from "@/lib/utils"
import { Icon } from "../primitives/boffmedia/icon"
import { BoffCard as Card } from "../primitives/boffmedia/card"

interface GameData {
  slug: string
  name: string
  short: string
  tagline: string
  hue: number
  logoLabel: string
  categories: {
    name: string
    tools: { name: string; href: string; icon: string; badge?: string }[]
  }[]
  tools: { title: string; desc: string; icon: string; features: string[]; href: string; popularity?: string; soon?: boolean; isNew?: boolean }[]
  featured: {
    title: string
    isNew?: boolean
    desc: string
    features: string[]
    href: string
    icon: string
    image: string
  }
}

interface GameCardProps {
  game: GameData
  go: (path: string) => void
  delay?: number
  className?: string
}

export function GameCard({ game, go, delay = 0, className }: GameCardProps) {
  const count =
    game.tools.length +
    game.categories.reduce((a, c) => a + c.tools.length, 0)

  return (
    <Card
      hover
      className={cn("reveal cursor-pointer", className)}
      style={{ "--hue": `${game.hue}deg`, transitionDelay: `${delay}ms` } as React.CSSProperties}
      onClick={() => go(`/herramientas/${game.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") go(`/herramientas/${game.slug}`)
      }}
    >
      <div className="p-5">
        {/* Accent bar */}
        <div
          className="h-1 w-12 rounded-full mb-4"
          style={{ background: `hsl(${game.hue}, 70%, 55%)` }}
        />
        {/* Head */}
        <div className="flex gap-4 items-center mb-4">
          <span
            className="grid place-items-center w-12 h-12 rounded-[var(--radius,14px)] font-display font-bold text-lg text-white"
            style={{
              background: `hsl(${game.hue}, 60%, 30%)`,
              color: `hsl(${game.hue}, 80%, 75%)`,
            }}
          >
            {game.logoLabel}
          </span>
          <div>
            <h3 className="text-t-lg font-bold">{game.name}</h3>
            <p className="text-t-sm text-[var(--text-muted,#a9abb8)]">
              {game.tagline}
            </p>
          </div>
        </div>
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          {game.categories.slice(0, 3).map((c) => (
            <span
              key={c.name}
              className="inline-flex items-center gap-2 text-t-xs font-mono px-2.5 py-1 rounded-[var(--radius,14px)] bg-[var(--surface-3,#1f1f30)] text-[var(--text-muted,#a9abb8)]"
            >
              <span>{c.name}</span>
              <span className="text-[var(--accent-bright,var(--cyan-400))]">
                {c.tools.length}
              </span>
            </span>
          ))}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t-[var(--hairline,1px)] border-solid border-t-[var(--border,rgba(255,255,255,0.08))]">
          <span className="flex items-center gap-1.5 text-t-xs text-[var(--text-muted,#a9abb8)]">
            <Icon name="layers" size={14} />
            {count} herramientas
          </span>
          <span className="flex items-center gap-1 text-t-xs font-semibold text-[var(--accent-bright,var(--cyan-400))]">
            Explorar <Icon name="arrow" size={14} />
          </span>
        </div>
      </div>
    </Card>
  )
}
