"use client"

import { useMemo, useState } from "react"
import { Chip, Empty, Eyebrow, FilterChip, Icon, SearchBar } from "./ui"
import { StopRow } from "./StopRow"
import type { EnrichedStop } from "../_types"

/**
 * Viajar — the destination list.
 *
 * Sorted by distance because that is the axis the fare is priced on: nearest first is
 * also cheapest first. Favourites and recents are shortcuts to the same rows, so they
 * only appear when the list is unfiltered — otherwise they'd contradict the filter.
 */
export function DestinationsPanel({
  stops,
  balance,
  selected,
  favorites,
  recents,
  onSelect,
  onToggleFavorite,
}: {
  stops: EnrichedStop[]
  balance?: number
  selected: EnrichedStop | null
  favorites: string[]
  recents: string[]
  onSelect: (stop: EnrichedStop) => void
  onToggleFavorite: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<"near" | "far">("near")
  const [region, setRegion] = useState<string>(ALL)

  // Only regions at least one stop actually stands in — the filter can never offer an
  // empty result.
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const stop of stops) if (stop.region) counts[stop.region] = (counts[stop.region] ?? 0) + 1
    return counts
  }, [stops])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stops
      .filter((s) => region === ALL || s.region === region)
      .filter((s) => !q || s.id.toLowerCase().includes(q) || (s.region ?? "").toLowerCase().includes(q))
      .sort((a, b) => (sort === "near" ? a.dist - b.dist : b.dist - a.dist))
  }, [stops, query, sort, region])

  const byId = (id: string) => stops.find((s) => s.id === id)
  const favStops = favorites.map(byId).filter(isStop)
  const recentStops = recents.map(byId).filter(isStop)
  const unfiltered = !query && region === ALL

  return (
    <div className="tx-scroll flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-3.5">
      <SearchBar
        value={query}
        onChange={setQuery}
        sort={sort}
        onToggleSort={() => setSort(sort === "near" ? "far" : "near")}
      />

      {Object.keys(regionCounts).length > 0 && (
        <div className="tx-rail flex shrink-0 gap-[7px] overflow-x-auto pb-1">
          <FilterChip active={region === ALL} count={stops.length} onClick={() => setRegion(ALL)}>
            Todos
          </FilterChip>
          {Object.entries(regionCounts)
            .sort(([a], [b]) => a.localeCompare(b, "es"))
            .map(([name, count]) => (
              <FilterChip
                key={name}
                active={region === name}
                count={count}
                onClick={() => setRegion(region === name ? ALL : name)}
              >
                {name}
              </FilterChip>
            ))}
        </div>
      )}

      {favStops.length > 0 && unfiltered && (
        <div className="flex shrink-0 flex-col gap-2">
          <Eyebrow icon="star">Favoritos</Eyebrow>
          <div className="tx-rail flex gap-2 overflow-x-auto pb-1">
            {favStops.map((s) => (
              <Chip key={s.id} active={selected?.id === s.id} onClick={() => onSelect(s)}>
                <Icon name="star" size={12} stroke={2.4} style={{ fill: "currentColor" }} className="text-tx-accent" />
                {s.id}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {recentStops.length > 0 && unfiltered && (
        <div className="flex shrink-0 flex-col gap-2">
          <Eyebrow icon="clock">Recientes</Eyebrow>
          <div className="tx-rail flex gap-2 overflow-x-auto pb-1">
            {recentStops.map((s) => (
              <Chip key={s.id} active={selected?.id === s.id} onClick={() => onSelect(s)}>
                <Icon name="pin" size={12} stroke={2.4} className="text-tx-blue-400" />
                {s.id}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between px-0.5 text-xs font-extrabold text-tx-txt-3">
        <span>
          {list.length} {list.length === 1 ? "destino" : "destinos"}
        </span>
        <span className="text-tx-accent">{sort === "near" ? "Más cercano" : "Más lejano"}</span>
      </div>

      <div className="flex flex-col gap-[9px]">
        {list.length === 0 ? (
          <Empty
            message="Ningún destino coincide con tu búsqueda."
            action="Ver todos"
            onAction={() => {
              setQuery("")
              setRegion(ALL)
            }}
          />
        ) : (
          list.map((stop) => (
            <StopRow
              key={stop.id}
              stop={stop}
              selected={selected?.id === stop.id}
              affordable={balance === undefined || balance >= stop.price}
              favorite={favorites.includes(stop.id)}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>
    </div>
  )
}

const ALL = "Todos"

function isStop(s: EnrichedStop | undefined): s is EnrichedStop {
  return Boolean(s)
}
