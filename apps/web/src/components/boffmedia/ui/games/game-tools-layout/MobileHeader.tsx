"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronDown, Menu } from "lucide-react"
import type { GameConfig } from "@/config/gameTools"

interface MobileHeaderProps {
  gameConfig: GameConfig
  onMenuClick: () => void
}

const GAMES = [
  { slug: "pokemon", name: "Pokémon", icon: "/img/games/pokemon/icon.webp" },
  { slug: "mhwilds", name: "Monster Hunter Wilds", icon: "/img/games/mhwilds/icon.webp" },
]

export function MobileHeader({ gameConfig, onMenuClick }: MobileHeaderProps) {
  const t = useTranslations()
  const router = useRouter()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!switcherOpen) return
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node))
        setSwitcherOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [switcherOpen])

  return (
    <div
      className="md:hidden sticky z-20"
      style={{
        top: "64px",
        background: "var(--surface, #12121b)",
        borderBottom: "var(--hairline, 1px) solid var(--border, rgba(255,255,255,0.08))",
      }}
    >
      <div className="flex items-center justify-between px-4 py-[0.55rem]">
        <div ref={switcherRef} className="relative">
          <button
            className="flex items-center gap-2.5 border-0 bg-transparent p-[3px] rounded-[var(--radius,14px)] cursor-pointer hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] transition-colors duration-[var(--dur,0.32s)]"
            onClick={() => setSwitcherOpen(!switcherOpen)}
          >
            {gameConfig.icon ? (
              <Image src={gameConfig.icon} alt={t(gameConfig.name)} width={28} height={28} className="object-contain shrink-0" />
            ) : null}
            <span
              className="font-bold whitespace-nowrap"
              style={{ fontSize: "var(--t-sm, 0.875rem)", color: "var(--text, #f4f4f7)" }}
            >
              {t(gameConfig.name)}
            </span>
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--text-dim, #71737f)" }}
            />
          </button>

          {switcherOpen && (
            <div
              className="absolute top-full left-0 z-50 mt-1 min-w-[200px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] py-1"
              onClick={() => setSwitcherOpen(false)}
            >
              {GAMES.map((g) => {
                const isCurrent = g.slug === gameConfig.slug
                return (
                  <button
                    key={g.slug}
                    onClick={() => router.push(`/herramientas/${g.slug}`)}
                    className={`flex items-center gap-[0.6rem] w-full text-left px-3 py-[0.55rem] border-0 bg-transparent cursor-pointer text-[length:var(--t-sm)] transition-[background,color] duration-[var(--dur)] ${
                      isCurrent
                        ? "text-[var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                    }`}
                  >
                    {g.icon && (
                      <Image src={g.icon} alt="" width={22} height={22} className="object-contain shrink-0" />
                    )}
                    <span className="flex-1">{g.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={onMenuClick}
          className="flex items-center justify-center w-9 h-9 rounded-[var(--btn-radius)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] cursor-pointer bg-transparent border-0 transition-colors duration-[var(--dur)]"
          aria-label="Menú"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
