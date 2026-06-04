"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { GiGamepad } from "react-icons/gi"
import { ChevronDown } from "lucide-react"
import type { GameConfig } from "@/config/gameTools"

interface DesktopSidebarProps {
  gameConfig: GameConfig
  isActive: (href: string) => boolean
}

export function DesktopSidebar({ gameConfig, isActive }: DesktopSidebarProps) {
  const t = useTranslations()

  return (
    <div
      className="hidden md:flex sticky self-start flex-shrink-0 z-20 overflow-hidden duration-[var(--dur,0.32s)] ease-[var(--ease)] group"
      style={{
        top: "64px",
        width: "68px",
        height: "calc(100vh - 64px)",
        background: "var(--surface, #12121b)",
        borderRight: "var(--hairline, 1px) solid var(--border, rgba(255,255,255,0.08))",
        transition: "width var(--dur, 0.32s) var(--ease, cubic-bezier(0.22,1,0.36,1))",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.width = "248px"
        e.currentTarget.style.boxShadow = "0 0 50px -10px var(--shadow-color, rgba(0,0,0,0.55))"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.width = "68px"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div className="flex flex-col h-full">
        <div className="px-3 py-3 border-b" style={{ borderColor: "var(--border, rgba(255,255,255,0.08))" }}>
          <div className="flex items-center gap-2.5 w-full border-0 bg-transparent p-[3px] rounded-[var(--radius,14px)]">
            {gameConfig.icon ? (
              <Image src={gameConfig.icon} alt={t(gameConfig.name)} width={28} height={28} className="object-contain shrink-0" />
            ) : (
              <div
                className="w-[38px] h-[38px] shrink-0 rounded-[var(--radius,14px)] grid place-items-center overflow-hidden font-display font-extrabold text-[0.62rem] border"
                style={{
                  color: gameConfig.color ? "var(--orange-400)" : "var(--text-dim)",
                  background: gameConfig.color
                    ? "color-mix(in srgb, var(--orange-500) 20%, transparent)"
                    : "var(--surface-3)",
                  borderColor: gameConfig.color
                    ? "color-mix(in srgb, var(--orange-500) 45%, transparent)"
                    : "var(--border-strong)",
                }}
              >
                <GiGamepad className="h-4 w-4 text-orange-400" />
              </div>
            )}
            <span
              className="flex-1 text-left font-bold whitespace-nowrap opacity-0 transition-opacity duration-[var(--dur,0.32s)] ease-[var(--ease)] group-hover:opacity-100"
              style={{ fontSize: "var(--t-sm, 0.875rem)", color: "var(--text, #f4f4f7)" }}
            >
              {t(gameConfig.name)}
            </span>
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity duration-[var(--dur,0.32s)] ease-[var(--ease)] group-hover:opacity-100"
              style={{ color: "var(--text-dim, #71737f)" }}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6" style={{ scrollbarWidth: "thin" }}>
          {gameConfig.categories.map((category) => (
            <div key={category.name} className="flex flex-col">
              {category.href ? (
                <Link
                  href={category.href}
                  className="font-mono text-[0.6rem] tracking-[0.14em] uppercase px-2 mb-2.5 h-[0.9rem] whitespace-nowrap opacity-0 transition-opacity duration-[var(--dur,0.32s)] ease-[var(--ease)] group-hover:opacity-100 hover:text-[var(--text)]"
                  style={{ color: "var(--text-dim, #71737f)" }}
                >
                  {t(category.name)}
                </Link>
              ) : (
                <span
                  className="font-mono text-[0.6rem] tracking-[0.14em] uppercase px-2 mb-2.5 h-[0.9rem] whitespace-nowrap opacity-0 transition-opacity duration-[var(--dur,0.32s)] ease-[var(--ease)] group-hover:opacity-100"
                  style={{ color: "var(--text-dim, #71737f)" }}
                >
                  {t(category.name)}
                </span>
              )}

              <ul className="flex flex-col gap-[2px] m-0 p-0 list-none">
                {category.tools.map((tool) => {
                  const active = isActive(tool.href)
                  const Icon = tool.icon

                  return (
                    <li key={tool.href}>
                      <Link
                        href={tool.href}
                        className="relative flex items-center gap-[0.7rem] py-[0.6rem] px-[0.55rem] rounded-[var(--radius,14px)] transition-colors duration-[var(--dur,0.32s)] ease-[var(--ease)]"
                        style={{
                          color: active ? "var(--orange-500)" : "var(--text-muted, #a9abb8)",
                          background: active ? "color-mix(in srgb, var(--orange-500) 12%, transparent)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "var(--surface-2, #181826)"
                            e.currentTarget.style.color = "var(--text, #f4f4f7)"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "transparent"
                            e.currentTarget.style.color = "var(--text-muted, #a9abb8)"
                          }
                        }}
                      >
                        <Icon
                          className="shrink-0 h-[18px] w-[18px] transition-colors duration-[var(--dur,0.32s)]"
                          style={{ color: active ? "inherit" : "var(--text-dim, #71737f)" }}
                          {...tool.iconProps}
                        />

                        <span
                          className="flex-1 whitespace-nowrap font-medium opacity-0 transition-opacity duration-[var(--dur,0.32s)] ease-[var(--ease)] group-hover:opacity-100"
                          style={{ fontSize: "var(--t-sm, 0.875rem)" }}
                        >
                          {t(tool.name)}
                        </span>

                        {active && (
                          <span
                            className="w-[7px] h-[7px] rounded-full opacity-0 transition-opacity duration-[var(--dur,0.32s)] ease-[var(--ease)] group-hover:opacity-100 shrink-0"
                            style={{ background: "var(--orange-500)", boxShadow: "0 0 6px var(--orange-500)" }}
                          />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
