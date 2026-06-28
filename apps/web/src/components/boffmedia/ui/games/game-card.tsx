"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Icon } from "../../primitives/icon"
import { BoffCard as Card } from "../../primitives/card"
import { useScanAnimation } from "@/hooks/tools/useScanAnimation"
export interface GameData {
  slug: string
  name: string
  short: string
  tagline: string
  hue: number
  logoLabel: string
  icon?: string
  categories: {
    name: string
    tools: { name: string; href: string; icon: string; sidebarIcon?: string; badge?: string }[]
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
    hue?: number
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
  const scanY = useScanAnimation(hovered, 1400)

  const count =
    game.tools.length +
    game.categories.reduce((a, c) => a + c.tools.length, 0)

  const glowColor = `oklch(0.6 0.16 ${game.hue} / 0.25)`
  const scanlineColor = `oklch(0.7 0.16 ${game.hue} / 0.7)`

  return (
    <div
      className={cn(className, "h-full")}
      style={{ transitionDelay: `${delay}ms` }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Card
        className={cn("p-4 flex flex-col gap-3 cursor-pointer overflow-hidden group h-full")}
        style={{
          "--hue": game.hue,
          borderColor: hovered
            ? `oklch(0.6 0.16 ${game.hue} / 0.5)`
            : "var(--border)",
          boxShadow: hovered
            ? `0 0 45px ${glowColor}, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
            : undefined,
          transform: hovered ? "translateY(-4px)" : undefined,
          transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        } as React.CSSProperties}
        onClick={() => go(`/${game.slug}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") go(`/${game.slug}`)
        }}
      >
        {/* Top neon bar */}
        <div
          className="absolute inset-x-0 top-0 h-0.5 pointer-events-none transition-all duration-300"
          style={{
            background: `linear-gradient(90deg, #f97316, oklch(0.72 0.18 var(--hue, 200)))`,
            opacity: hovered ? 1 : 0.8,
            boxShadow: hovered ? `0 0 12px ${glowColor}` : "none",
          }}
          aria-hidden="true"
        />

        {/* Ambient inner glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${glowColor} 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0.65,
          }}
        />

        {/* Scan line */}
        {hovered && (
          <div
            className="absolute inset-x-0 h-px pointer-events-none z-20 transition-none"
            style={{
              top: `${scanY}%`,
              background: `linear-gradient(90deg, transparent, ${scanlineColor}, transparent)`,
            }}
          />
        )}

        {/* Corner brackets */}
        {([
          "top-2 left-2 w-3 h-3 border-t border-l",
          "top-2 right-2 w-3 h-3 border-t border-r",
          "bottom-2 left-2 w-3 h-3 border-b border-l",
          "bottom-2 right-2 w-3 h-3 border-b border-r",
        ] as const).map((cls, i) => (
          <div
            key={i}
            className={`absolute ${cls} transition-all duration-300 pointer-events-none`}
            style={{ borderColor: hovered ? scanlineColor : "var(--border)" }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full gap-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-[var(--radius-lg)] overflow-hidden shrink-0 flex items-center justify-center transition-[transform,box-shadow] duration-300"
              style={{
                border: "var(--hairline) solid oklch(0.6 0.14 var(--hue, 200) / 0.4)",
                background: "oklch(0.5 0.12 var(--hue, 200) / 0.16)",
                transform: hovered ? "scale(1.08)" : "scale(1)",
                boxShadow: hovered ? `0 0 30px -10px oklch(0.6 0.16 var(--hue, 200))` : undefined,
              }}
            >
              {game.icon ? (
                <Image src={game.icon} alt={game.name} width={36} height={36} className="object-contain" />
              ) : (
                <span
                  className="w-full h-full grid place-items-center font-display font-extrabold text-xs"
                  style={{ color: "oklch(0.85 0.12 var(--hue, 200))" }}
                >
                  {game.logoLabel}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-t-lg font-black mt-0.5 text-ink">{game.name}</h3>
              <p className="text-t-sm mt-1 leading-relaxed text-ink-muted">{game.tagline}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-layer-3/50 to-transparent" />

          {/* Category badges */}
          <div className="flex flex-wrap gap-1.5 flex-1 content-start">
            {game.categories.slice(0, 3).map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-layer-2 border border-edge text-t-xs font-medium text-secondary-hover"
              >
                {c.name}
                <span className="font-mono text-t-2xs text-ink-dim bg-layer-3 px-1.5 py-[1px] rounded">
                  {c.tools.length}
                </span>
              </span>
            ))}
          </div>

          {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-t-[var(--border)]">
            <span className="inline-flex items-center gap-[0.3rem] text-t-xs text-ink-dim font-mono">
              <Icon name="layers" size={12} /> {count} herramientas
            </span>
            <span className="inline-flex items-center gap-1 text-t-xs font-semibold transition-[gap] duration-[var(--dur)] ease-[var(--ease)] group-hover:gap-[0.6rem] uppercase text-secondary-hover">
              ACCEDER
              <Icon name="arrow" size={14} />
            </span>
          </div>
        </div>

        {/* Bottom glow line */}
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, #f97316, oklch(0.72 0.18 var(--hue, 200)))`,
            opacity: hovered ? 0.5 : 0.2,
          }}
          aria-hidden="true"
        />
      </Card>
    </div>
  )
}
