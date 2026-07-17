"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import { ChevronLeftIcon, ChevronRightIcon, ArrowUpRightIcon, BookmarkIcon } from "lucide-react"
import { getPokemonNameAndForm, PILL_STATUS, PokedexStatus } from "../../../dexUtils"
import { usePokedexData } from "@/hooks/usePokedexData"
import type { Pokemon } from "@/types/Pokemon"
import { useTranslations } from "next-intl"
import { TypeChip, StatusPill } from "../../../_components/ui"
import { HubSidebar } from "../../../_components/HubSidebar"
import { TYPE_COLORS } from "../../../_utils/typeColors"

// Section ids match the scroll-spy targets rendered by page.tsx.
const TABS = [
  { id: "info", label: "Info" },
  { id: "evo", label: "Evolución" },
  { id: "stats", label: "Estadísticas" },
  { id: "effect", label: "Efectividades" },
  { id: "spawns", label: "Spawns" },
  { id: "moves", label: "Movimientos" },
  { id: "variants", label: "Variantes" },
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
  // Null when the nextprev lookup failed — the entry still renders, just without the pager.
  prev: { dex: number; name: string; spriteUrl: string } | null
  next: { dex: number; name: string; spriteUrl: string } | null
  children?: React.ReactNode
}) {
  const t = useTranslations("pokedex")
  const types = pokemon.forms[0]?.types as string[] | undefined
  // Subscribed, not read once: the dex usually lands after this renders.
  const { getPokemonStatus } = usePokedexData()
  const status = getPokemonStatus(pokemon.dex, formName)
  const isVisible = status !== PokedexStatus.UNSEEN
  const [activeTab, setActiveTab] = useState<string>("info")
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    const callback: IntersectionObserverCallback = (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length > 0) setActiveTab(visible[0].target.id)
    }
    observerRef.current = new IntersectionObserver(callback, { rootMargin: "-10% 0px -80% 0px", threshold: 0 })
    TABS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current!.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  const type1 = types?.[0]
  const portraitBg = `radial-gradient(40px 30px at 50% 30%, rgba(255,255,255,.06), transparent 70%), ${
    type1 && TYPE_COLORS[type1] ? TYPE_COLORS[type1] : "#18212f"
  }`

  return (
    <div className="flex h-full">
      <HubSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-[rgba(10,15,26,0.85)] backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.05] px-6 pt-3.5">
          <div className="flex items-center gap-5 pb-3">
            <div className="w-16 h-16 rounded-[14px] grid place-items-center shrink-0 relative overflow-hidden" style={{ background: portraitBg }}>
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
            <div className="min-w-0">
              <div className="font-pk-mono text-xs text-pk-surface-500 tracking-[0.04em]">N.º {String(pokemon.dex).padStart(4, "0")}</div>
              <h1 className="font-pk-display font-bold text-[28px] leading-[1.05] tracking-tight text-pk-surface-50 my-0.5 mb-2">
                {isVisible ? getPokemonNameAndForm(pokemon.name, formName, t) : "???"}
              </h1>
              <div className="flex items-center gap-2.5 flex-wrap">
                {types?.map((type) => (
                  <TypeChip key={type} type={type} size="md" />
                ))}
                <StatusPill status={PILL_STATUS[status]} size="md" />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-9 h-9 bg-white/[0.04] border border-white/[0.08] rounded-[9px] grid place-items-center text-pk-surface-300">
                <ArrowUpRightIcon className="w-4 h-4" />
              </span>
              <span className="w-9 h-9 bg-white/[0.04] border border-white/[0.08] rounded-[9px] grid place-items-center text-pk-surface-300">
                <BookmarkIcon className="w-4 h-4" />
              </span>
              {(prev || next) && (
                <div className="flex items-center gap-px bg-white/[0.04] border border-white/[0.06] rounded-[10px] p-[3px]">
                  {prev && (
                    <Link
                      href={`/smartrotom/pokedex/entrada/${prev.dex}`}
                      title={`#${prev.dex} ${prev.name}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-pk-surface-300 hover:text-pk-surface-50 hover:bg-white/[0.05] transition-colors text-xs"
                    >
                      <ChevronLeftIcon className="w-3.5 h-3.5" />
                      <span className="font-pk-mono text-[11px] text-pk-surface-500">#{String(prev.dex).padStart(3, "0")}</span>
                    </Link>
                  )}
                  {prev && next && <span className="w-px h-[18px] bg-white/[0.08]" />}
                  {next && (
                    <Link
                      href={`/smartrotom/pokedex/entrada/${next.dex}`}
                      title={`#${next.dex} ${next.name}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-pk-surface-300 hover:text-pk-surface-50 hover:bg-white/[0.05] transition-colors text-xs"
                    >
                      <span className="font-pk-mono text-[11px] text-pk-surface-500">#{String(next.dex).padStart(3, "0")}</span>
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <nav className="flex gap-0.5 overflow-x-auto scrollbar-none" role="tablist">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={`#${tab.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={`relative px-3.5 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap inline-flex items-center gap-[7px] ${
                    isActive ? "text-pk-primary-300" : "text-pk-surface-400 hover:text-pk-surface-100"
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isActive ? "#fb923c" : "#4a576e", boxShadow: isActive ? "0 0 6px #fb923c" : "none" }}
                  />
                  {tab.label}
                  {isActive && (
                    <span className="absolute left-3.5 right-3.5 -bottom-px h-[2px] rounded-full" style={{ background: "#fb923c", boxShadow: "0 0 8px #fb923c" }} />
                  )}
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
