"use client"

import Link from "next/link"
import { Icon, SearchBar, SectionTitle, Skeleton } from "./ui"
import { FollowRow } from "./FollowRow"
import { useSuggestions, useTrends } from "../_hooks/queries"
import { fmt } from "../_utils/format"

/**
 * The discovery rail.
 *
 * Both boxes are derived, not curated: **Tendencias** is a GROUP BY over the hashtags of
 * the last seven days of trinos, and **A quién seguir** is the trainers with the most
 * followers you are not already following. Neither has an editorial table behind it, and
 * neither shows anything until players have actually posted — which is honest, and is
 * why each has a real empty state rather than filler.
 *
 * The handoff also put an "Eventos en vivo" box here. Server events have no API, so it
 * is deferred rather than mocked (docs/smartrotom/deferred/README.md).
 */
function Box({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-rk border border-rk-line bg-rk-card">{children}</div>
}

export function RightRail() {
  const { data: trends, isLoading: trendsLoading } = useTrends(5)
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestions(3)

  return (
    <div className="flex flex-col gap-4 py-3">
      <div className="sticky top-0 z-10 bg-rk-bg pb-1">
        <SearchBar />
      </div>

      <Box>
        <div className="px-4 pb-1.5 pt-3">
          <SectionTitle icon="trending" title="Tendencias" />
        </div>

        {trendsLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : trends?.length ? (
          trends.map((t) => (
            <Link
              key={t.tag}
              href={`/smartrotom/rooker/buscar?q=${encodeURIComponent(t.tag)}`}
              className="flex items-start justify-between gap-2.5 px-4 py-2.5 transition-colors hover:bg-rk-hover"
            >
              <div className="min-w-0">
                <div className="text-[12px] text-rk-fg-subtle">Tendencia en el nido</div>
                <div className="mt-px truncate text-[15px] font-bold text-rk-fg">#{t.tag}</div>
                <div className="text-[12.5px] text-rk-fg-subtle">
                  {fmt(t.posts)} {t.posts === 1 ? "trino" : "trinos"}
                </div>
              </div>
              <Icon name="more" size={16} className="mt-1 flex-none text-rk-fg-subtle" />
            </Link>
          ))
        ) : (
          <p className="px-4 pb-4 pt-1 text-[13.5px] leading-relaxed text-rk-fg-subtle">
            Todavía no hay tendencias. Usa una #etiqueta en tu próximo trino y aparecerá aquí.
          </p>
        )}
      </Box>

      <Box>
        <div className="px-4 pb-1.5 pt-3">
          <SectionTitle icon="users" title="A quién seguir" />
        </div>

        {suggestionsLoading ? (
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-[42px] w-[42px] rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : suggestions?.length ? (
          suggestions.map((u) => <FollowRow key={u.uuid} user={u} />)
        ) : (
          <p className="px-4 pb-4 pt-1 text-[13.5px] leading-relaxed text-rk-fg-subtle">
            Ya sigues a todo el nido.
          </p>
        )}
      </Box>

      <p className="px-4 pb-4 text-[12px] leading-loose text-rk-fg-subtle">
        Rooker · parte del ecosistema BoffMedia · SmartRotom
      </p>
    </div>
  )
}
