"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { cn } from "@/lib/utils"
import { EmptyState, Skeleton, SubHeader } from "../_components/ui"
import { DexTile } from "../_components/DexTile"
import { useMe, useRookerUuid } from "../_hooks/queries"
import { useVitrina } from "../_hooks/useVitrina"

type Filter = "todos" | "shiny"

/**
 * La Vitrina — the trainer's collection.
 *
 * Every tile is a real `rotom_pokedex` row, so the ring at the top is a real completion
 * percentage, not a decoration. There is no "favoritos" filter: favourites are a PC
 * concept (`rotom_pc_marks`, keyed on a content hash) and the registry has no notion of
 * them, so offering the filter would have meant an always-empty tab.
 */
export default function VitrinaPage() {
  const t = useTranslations("rooker")
  const uuid = useRookerUuid()
  const { data: me } = useMe()
  const { data: entries, isLoading } = useVitrina(uuid)
  const allPokemon = usePokemonStore((s) => s.allPokemon)

  const [filter, setFilter] = useState<Filter>("todos")

  const named = useMemo(
    () =>
      (entries ?? []).map((e) => ({
        ...e,
        name: allPokemon.find((p) => p.dex === e.dex)?.name,
      })),
    [entries, allPokemon],
  )

  const shown = filter === "shiny" ? named.filter((e) => e.shiny) : named

  const species = new Set(named.map((e) => e.dex)).size
  const total = allPokemon.length
  const pct = total ? Math.round((species / total) * 100) : 0
  const shinies = named.filter((e) => e.shiny).length

  const r = 26
  const c = 2 * Math.PI * r

  if (!uuid) {
    return (
      <div>
        <SubHeader title={t("vitrina.title")} />
        <EmptyState icon="grid" title={t("common.loginRequiredTitle")} body={t("vitrina.loggedOutBody")} />
      </div>
    )
  }

  return (
    <div>
      <SubHeader title={t("vitrina.title")} subtitle={me?.displayName || me?.username} />

      <div className="flex items-center gap-4 border-b border-rk-line p-4">
        <div className="relative h-[4.25rem] w-[4.25rem] flex-none">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r={r} fill="none" strokeWidth="6" className="stroke-rk-line-strong" />
            <circle
              cx="34"
              cy="34"
              r={r}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - (total ? species / total : 0))}
              transform="rotate(-90 34 34)"
              className="stroke-rk-accent transition-[stroke-dashoffset] duration-500"
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[1rem] font-bold tabular-nums text-rk-fg">
            {pct}%
          </span>
        </div>
        <div>
          <div className="text-[1.125rem] font-bold text-rk-fg">
            {isLoading ? "…" : t("vitrina.registeredCount", { species, total })}
          </div>
          <div className="mt-0.5 text-[0.8125rem] text-rk-fg-muted">
            {t("vitrina.liveDexCount", { count: shinies })}
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3">
        {(["todos", "shiny"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "flex-none rounded-rk-pill px-4 py-1.5 text-[0.8125rem] font-bold transition-colors",
              filter === f
                ? "bg-rk-accent text-rk-accent-fg"
                : "border border-rk-line-strong bg-rk-card text-rk-fg-muted hover:bg-rk-hover",
            )}
          >
            {f === "todos" ? t("vitrina.filters.all") : t("vitrina.filters.shiny")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2 px-4 pb-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : shown.length ? (
        <div className="grid grid-cols-4 gap-2 px-4 pb-5 sm:grid-cols-5">
          {shown.map((e, i) => (
            <DexTile
              key={`${e.dex}-${e.form}-${e.palette}-${i}`}
              dex={e.dex}
              form={e.form}
              palette={e.palette}
              shiny={e.shiny}
              name={e.name}
              size={76}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="grid"
          title={filter === "shiny" ? t("vitrina.emptyShiny.title") : t("vitrina.emptyAll.title")}
          body={filter === "shiny" ? t("vitrina.emptyShiny.body") : t("vitrina.emptyAll.body")}
        />
      )}
    </div>
  )
}
