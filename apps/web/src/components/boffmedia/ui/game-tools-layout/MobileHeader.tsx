"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { GiGamepad } from "react-icons/gi"
import { Menu } from "lucide-react"
import type { GameConfig } from "@/config/gameTools"

interface MobileHeaderProps {
  gameConfig: GameConfig
  onMenuClick: () => void
}

export function MobileHeader({ gameConfig, onMenuClick }: MobileHeaderProps) {
  const t = useTranslations()

  return (
    <div
      className="md:hidden sticky z-20"
      style={{
        top: "64px",
        background: "var(--surface, #12121b)",
        borderBottom: "var(--hairline, 1px) solid var(--border, rgba(255,255,255,0.08))",
      }}
    >
      <button
        onClick={onMenuClick}
        className="flex items-center gap-2.5 w-full border-0 px-4 py-[0.7rem] cursor-pointer text-[var(--text)] bg-transparent"
      >
        <div
          className="w-[34px] h-[34px] shrink-0 rounded-[var(--radius,14px)] grid place-items-center overflow-hidden border"
          style={{
            background: "color-mix(in srgb, var(--orange-500) 20%, transparent)",
            borderColor: "color-mix(in srgb, var(--orange-500) 45%, transparent)",
          }}
        >
          {gameConfig.icon ? (
            <Image src={gameConfig.icon} alt={t(gameConfig.name)} width={24} height={24} className="object-contain" />
          ) : (
            <GiGamepad className="h-3.5 w-3.5 text-orange-400" />
          )}
        </div>
        <span className="flex-1 text-left font-bold text-sm" style={{ fontFamily: "var(--font-display, Orbitron, sans-serif)" }}>
          {t(gameConfig.name)}
        </span>
        <Menu className="h-4 w-4" style={{ color: "var(--text-dim, #71737f)" }} />
      </button>
    </div>
  )
}
