"use client"

import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { GiGamepad } from "react-icons/gi"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GameConfig } from "@/config/gameTools"

interface MobileSidebarProps {
  gameConfig: GameConfig
  isOpen: boolean
  onClose: () => void
  isActive: (href: string) => boolean
}

export function MobileSidebar({ gameConfig, isOpen, onClose, isActive }: MobileSidebarProps) {
  const t = useTranslations()

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] md:hidden pointer-events-none",
        isOpen && "!pointer-events-auto",
      )}
    >
      <div
        className="absolute inset-0 transition-opacity duration-[var(--dur,0.32s)] ease-[var(--ease)]"
        style={{ background: "rgba(0,0,0,0.5)", opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />

      <div
        className="absolute top-0 bottom-0 left-0 flex flex-col transition-transform duration-[var(--dur,0.32s)] ease-[var(--ease)] overflow-hidden"
        style={{
          width: "min(82vw, 320px)",
          background: "var(--surface, #12121b)",
          borderRight: "var(--hairline, 1px) solid var(--border-strong, rgba(255,255,255,0.16))",
          transform: isOpen ? "none" : "translateX(-100%)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-4 shrink-0"
          style={{ borderBottom: "var(--hairline, 1px) solid var(--border, rgba(255,255,255,0.08))" }}
        >
          <div className="flex items-center gap-2.5">
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
            <span className="font-black text-sm leading-none tracking-wide" style={{ fontFamily: "var(--font-display, Orbitron, sans-serif)", color: "var(--text, #f4f4f7)" }}>
              {t(gameConfig.name)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200"
            style={{
              border: "1px solid var(--border-strong, rgba(255,255,255,0.16))",
              background: "var(--surface-2, #181826)",
              color: "var(--text-dim, #71737f)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--orange-500)"
              e.currentTarget.style.color = "var(--orange-500)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong, rgba(255,255,255,0.16))"
              e.currentTarget.style.color = "var(--text-dim, #71737f)"
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6" style={{ scrollbarWidth: "thin" }}>
          {gameConfig.categories.map((category) => (
            <div key={category.name} className="flex flex-col">
              {category.href ? (
                <Link
                  href={category.href}
                  onClick={onClose}
                  className="font-mono text-[0.6rem] tracking-[0.14em] uppercase px-2 mb-2.5 text-ink-dim hover:text-ink transition-colors duration-[var(--dur)] block"
                >
                  {t(category.name)}
                </Link>
              ) : (
                <span className="font-mono text-[0.6rem] tracking-[0.14em] uppercase px-2 mb-2.5 text-ink-dim">
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
                        onClick={onClose}
                        className="flex items-center gap-[0.7rem] py-[0.6rem] px-[0.55rem] rounded-[var(--radius,14px)] transition-colors duration-[var(--dur,0.32s)]"
                        style={{
                          color: active ? "var(--orange-500)" : "var(--text-muted, #a9abb8)",
                          background: active ? "color-mix(in srgb, var(--orange-500) 12%, transparent)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "var(--layer-2)"
                            e.currentTarget.style.color = "var(--text)"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "transparent"
                            e.currentTarget.style.color = "var(--text-muted)"
                          }
                        }}
                      >
                        <Icon
                          className="shrink-0 h-[18px] w-[18px]"
                          style={{ color: active ? "inherit" : "var(--text-dim, #71737f)" }}
                          {...tool.iconProps}
                        />
                        <span className="flex-1 text-sm font-medium" style={{ color: active ? "var(--orange-500)" : "var(--text-muted)" }}>
                          {t(tool.name)}
                        </span>

                        {active && (
                          <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--orange-500)", boxShadow: "0 0 6px var(--orange-500)" }} />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to top, var(--surface, #12121b) 0%, transparent 100%)" }}
        />
      </div>
    </div>
  )
}
