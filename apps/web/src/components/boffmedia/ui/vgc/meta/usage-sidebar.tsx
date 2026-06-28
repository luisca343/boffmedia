"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { SearchableList } from "@/components/boffmedia/primitives/searchable-list"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import { fmtCount } from "./meta-data"

interface UsageEntry {
  id: string
  usage: number
  count: number
}

interface PokeData {
  id: string
  name: string
  dex: number
}

interface UsageSidebarProps {
  entries: UsageEntry[]
  pokeMap: Record<string, PokeData>
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  error?: string | null
}

export function VgcUsageSidebar({ entries, pokeMap, selectedId, onSelect, loading, error }: UsageSidebarProps) {
  const [search, setSearch] = useState("")
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? entries.filter((e) => {
      const p = pokeMap[e.id]
      return p && p.name.toLowerCase().includes(q)
    }) : entries
  }, [search, entries, pokeMap])

  return (
    <SearchableList
      items={filtered}
      search={search}
      onSearchChange={setSearch}
      loading={loading}
      error={error}
      emptyMessage="Sin resultados"
      placeholder="Buscar Pokémon…"
      renderItem={(entry: UsageEntry) => {
        const p = pokeMap[entry.id]
        if (!p) return null
        const rank = entries.indexOf(entry) + 1
        const isSelected = entry.id === selectedId
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry.id)}
            className={cn(
              "grid grid-cols-[26px_34px_1fr_auto] gap-[0.55rem] items-center w-full text-left",
              "px-2.5 py-2 rounded-[var(--radius)] border border-transparent cursor-pointer transition-colors",
              isSelected
                ? "bg-secondary-soft border-[color-mix(in_srgb,var(--secondary)_30%,transparent)]"
                : "hover:bg-[color-mix(in_srgb,var(--layer-3)_55%,transparent)] bg-transparent",
            )}
          >
            <span className={cn(
              "font-mono text-[11px] text-right",
              isSelected ? "text-secondary-hover" : "text-ink-dim",
            )}>
              #{rank}
            </span>
            <img
              src={spriteUrl(p.name)}
              alt={p.name}
              width={34}
              height={34}
              className="object-contain shrink-0"
              onError={handleSpriteError}
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink truncate">{p.name}</span>
              <span className="block font-mono text-[10px] text-ink-dim">{fmtCount(entry.count)}</span>
            </span>
            <span className={cn(
              "font-mono text-sm font-bold shrink-0",
              isSelected ? "text-secondary-hover" : "text-ink-muted",
            )}>
              {entry.usage.toFixed(2)}%
            </span>
          </button>
        )
      }}
    />
  )
}
