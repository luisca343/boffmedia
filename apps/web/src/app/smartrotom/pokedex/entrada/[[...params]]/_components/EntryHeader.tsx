"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { getDisplayStatus, getPokemonNameAndForm } from "../../../dexUtils"
import type { Pokemon } from "@/types/Pokemon"
import { InternalLink } from "@/components/ui/navigation/Link"
import { useTranslations } from "next-intl"
import { TypeChip } from "../../../_components/TypeChip"
import { StatusPill } from "../../../_components/StatusPill"
import { HubSidebar } from "../../../_components/HubSidebar"

const TABS = [
  { id: "info", labelKey: "entry_tab_info" },
  { id: "evotree", labelKey: "entry_tab_evotree" },
  { id: "stats", labelKey: "entry_tab_stats" },
  { id: "typedata", labelKey: "entry_tab_types" },
  { id: "spawns", labelKey: "entry_tab_spawns" },
  { id: "moves", labelKey: "entry_tab_moves" },
  { id: "palettes", labelKey: "entry_tab_variants" },
]

export function EntryHeader({
  pokemon,
  formName,
  prev,
  next,
  children,
}: {
  pokemon: Pokemon
  formName: string
  prev: { dex: number; name: string; spriteUrl: string }
  next: { dex: number; name: string; spriteUrl: string }
  children?: React.ReactNode
}) {
  const t = useTranslations("pokedex")
  const types = pokemon.forms[0]?.types as string[] | undefined
  const isVisible = getDisplayStatus(pokemon.dex, formName, true)
  const [activeTab, setActiveTab] = useState<string>("info")
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Track which section is currently in view using IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    const callback: IntersectionObserverCallback = (entries) => {
      // Find the first entry that is intersecting, topmost in the viewport
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length > 0) {
        setActiveTab(visible[0].target.id)
      }
    }

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-10% 0px -80% 0px",
      threshold: 0,
    })

    TABS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current!.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-surface-950/85 backdrop-blur-xl border-b border-white/[0.05] px-6 pt-3">
          <div className="flex items-center gap-5 pb-3">
            <div
              className="w-16 h-16 rounded-[14px] grid place-items-center shrink-0 overflow-hidden"
              style={{
                background: `radial-gradient(40px 30px at 50% 30%, rgba(255,255,255,0.06), transparent 70%), var(--type-bg, rgb(var(--surface-800)))`,
              }}
            >
              <PokemonSprite
                id={pokemon.dex}
                form={formName}
                palette="none"
                width={56}
                height={56}
                hide={true}
                inverted={true}
                url={pokemon.forms[0]?.spriteUrl}
                className="relative z-10 drop-shadow-[0_3px_4px_rgba(0,0,0,0.4)]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-jetbrains text-xs text-surface-500 tracking-wider">
                #{String(pokemon.dex).padStart(3, "0")}
              </span>
              <h1 className="font-orbitron font-bold text-[28px] leading-tight tracking-tight text-surface-50 mt-0.5 mb-2">
                {isVisible ? getPokemonNameAndForm(pokemon.name, formName, t) : "???"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {types?.map((type) => (
                  <TypeChip key={type} type={type} size="sm" />
                ))}
                <StatusPill status={isVisible ? "caught" : "unknown"} size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-[10px] p-[3px]">
              <InternalLink
                href={`/smartrotom/pokedex/entrada/${prev.dex}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-surface-300 hover:text-surface-50 hover:bg-white/[0.05] transition-colors text-xs"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="hidden md:inline font-jetbrains text-[11px] text-surface-500">#{prev.dex}</span>
              </InternalLink>
              <div className="w-px h-[18px] bg-white/[0.08]" />
              <InternalLink
                href={`/smartrotom/pokedex/entrada/${next.dex}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-surface-300 hover:text-surface-50 hover:bg-white/[0.05] transition-colors text-xs"
              >
                <span className="hidden md:inline font-jetbrains text-[11px] text-surface-500">#{next.dex}</span>
                <ChevronRightIcon className="w-4 h-4" />
              </InternalLink>
            </div>
          </div>

          <nav className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-1 px-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={`#${tab.id}`}
                  className="relative px-3.5 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap flex items-center gap-[7px]"
                  style={{ color: isActive ? "rgb(var(--primary-300))" : "rgb(var(--surface-400))" }}
                >
                  {/* Active underline glow */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                      style={{
                        background: "rgb(var(--primary-400))",
                        boxShadow: "0 0 6px rgb(var(--primary-400))",
                      }}
                    />
                  )}
                  <span
                    className="w-1.5 h-1.5 rounded-full transition-colors"
                    style={{
                      background: isActive ? "rgb(var(--primary-400))" : "rgb(var(--surface-600))",
                      boxShadow: isActive ? "0 0 4px rgb(var(--primary-400))" : "none",
                    }}
                  />
                  {t(tab.labelKey as any)}
                </Link>
              )
            })}
          </nav>
        </header>

        {children && <div className="flex-1 overflow-auto">{children}</div>}
      </div>
    </div>
  )
}
