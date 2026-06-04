"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "../primitives/icon"
import { BoffCard as Card } from "../primitives/card"

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
  const [hovered, setHovered] = React.useState(false)
  const count =
    game.tools.length +
    game.categories.reduce((a, c) => a + c.tools.length, 0)

  return (
    <div
      className={cn("reveal", className)}
      style={{ transitionDelay: `${delay}ms` }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Card
        className={cn("p-6 flex flex-col gap-5 cursor-pointer overflow-hidden group")}
        style={{
          "--hue": game.hue,
          ...(hovered ? {
            transform: "translateY(-4px)",
            boxShadow: "var(--card-shadow-hover)",
          } : {}),
          borderColor: hovered
            ? "color-mix(in srgb, var(--orange-500) 50%, var(--border))"
            : "var(--border)",
        } as React.CSSProperties}
        onClick={() => go(`/herramientas/${game.slug}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") go(`/herramientas/${game.slug}`)
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-0.5 pointer-events-none"
          style={{ background: `linear-gradient(90deg, var(--orange-500), oklch(0.72 0.18 var(--hue, 200)))` }}
          aria-hidden="true"
        />
        <div className="flex items-start gap-4">
          <span
            className="w-14 h-14 rounded-[var(--radius-lg)] shrink-0 grid place-items-center font-display font-extrabold text-xs"
            style={{
              color: "oklch(0.85 0.12 var(--hue, 200))",
              background: "oklch(0.5 0.12 var(--hue, 200) / 0.16)",
              border: "var(--hairline) solid oklch(0.6 0.14 var(--hue, 200) / 0.4)",
            }}
          >
            {game.logoLabel}
          </span>
          <div>
            <h3 className="text-t-xl">{game.name}</h3>
            <p className="text-t-sm mt-1 leading-relaxed text-[var(--text-muted)]">{game.tagline}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {game.categories.slice(0, 3).map((c) => (
            <span key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius)] bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-t-sm font-semibold text-[var(--accent-bright)]">{c.name}</span>
              <span className="font-mono text-t-xs text-[var(--text-dim)] px-2 py-0.5 rounded-full bg-[var(--surface-3)]">{c.tools.length}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-t-[var(--border)]">
          <span className="inline-flex items-center gap-[0.4rem] text-t-xs text-[var(--text-dim)] font-mono">
            <Icon name="layers" size={14} /> {count} herramientas
          </span>
          <span className="inline-flex items-center text-t-sm font-semibold text-orange-500 transition-[gap] duration-[var(--dur)] ease-[var(--ease)] group-hover:gap-[0.7rem]">
            Explorar <Icon name="arrow" size={16} />
          </span>
        </div>
      </Card>
    </div>
  )
}
