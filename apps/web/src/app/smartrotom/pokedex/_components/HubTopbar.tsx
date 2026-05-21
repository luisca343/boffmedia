"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon, BoltIcon, FunnelIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"
import { TypeChip } from "./TypeChip"
import { StatusPill } from "./StatusPill"
import { usePokemonStore } from "@/stores/pokemonStore"
import { usePokedexData } from "@/hooks/usePokedexData"
import { PokedexStatus } from "../dexUtils"
import Image from "next/image"
import { getSpriteUrl } from "@/utils/spriteUtils"

export function HubTopbar() {
  const t = useTranslations("pokedex")
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { allPokemon, fetchAllPokemon } = usePokemonStore()
  const { getPokemonStatus } = usePokedexData()

  useEffect(() => {
    if (allPokemon.length === 0) fetchAllPokemon()
  }, [allPokemon.length, fetchAllPokemon])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const results = useMemo(() => {
    if (query.trim().length < 2) return []
    const term = query.toLowerCase()
    return allPokemon
      .filter((p) => p.name.toLowerCase().includes(term) || String(p.dex).includes(term))
      .slice(0, 7)
  }, [query, allPokemon])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const r = results[active]
      if (r) {
        router.push(`/smartrotom/pokedex/entrada/${r.dex}`)
        setOpen(false)
        setQuery("")
      }
    } else if (e.key === "Escape") {
      inputRef.current?.blur()
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-4 justify-between">
      <div className="relative flex-1 max-w-[540px]">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-surface-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[10px] py-[11px] pr-3 pl-[42px] text-sm text-surface-50 font-inter outline-none placeholder:text-surface-500 focus:border-primary-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)] transition-colors"
          placeholder={t("hub_search_placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          aria-label={t("hub_search_placeholder")}
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
        />
        {query.length === 0 && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
            <kbd className="font-jetbrains text-[10px] px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] border-b-2 rounded text-surface-300">⌘</kbd>
            <kbd className="font-jetbrains text-[10px] px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] border-b-2 rounded text-surface-300">K</kbd>
          </div>
        )}
        {open && results.length > 0 && (
          <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-surface-900 border border-white/[0.08] rounded-xl p-1.5 max-h-[380px] overflow-y-auto shadow-dex-elevated z-20 animate-dropIn">
            {results.map((p, i) => {
              const spriteUrl = getSpriteUrl({ id: p.dex, form: "base", palette: "none" })
              const status = getPokemonStatus(p.dex, "base")
              const statusKey = status === PokedexStatus.CAUGHT ? "caught" : status === PokedexStatus.SEEN ? "seen" : status === PokedexStatus.SHINY ? "shiny" : "unknown"
              return (
                <button
                  key={p.dex}
                  className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-left transition-colors ${
                    i === active ? "bg-primary-400/10" : "hover:bg-white/[0.03]"
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    router.push(`/smartrotom/pokedex/entrada/${p.dex}`)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <span className="font-jetbrains text-[11px] text-surface-500 w-9">
                    #{String(p.dex).padStart(3, "0")}
                  </span>
                  {spriteUrl && (
                    <Image src={spriteUrl} alt="" width={36} height={36} style={{ imageRendering: "pixelated" }} />
                  )}
                  <span className="text-sm font-medium text-surface-100 flex-1">{p.name}</span>
                  <span className="flex gap-1">
                    {p.forms?.[0]?.types?.map((type: string) => (
                      <TypeChip key={type} type={type} size="sm" />
                    ))}
                  </span>
                  <StatusPill status={statusKey} size="sm" showLabel={false} />
                </button>
              )
            })}
            <div className="flex justify-between px-3.5 py-2 border-t border-white/[0.05] text-[11px] text-surface-500 font-jetbrains">
              <span>{t("hub_search_navigate")} · {t("hub_search_open")}</span>
              <span>{t("hub_search_results", { count: results.length, s: results.length === 1 ? "" : "s" })}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {[BoltIcon, FunnelIcon, Cog6ToothIcon].map((Icon, i) => (
          <button
            key={i}
            className="w-9 h-9 bg-white/[0.04] border border-white/[0.08] rounded-[9px] grid place-items-center text-surface-300 hover:text-surface-50 hover:bg-white/[0.07] transition-colors"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  )
}
