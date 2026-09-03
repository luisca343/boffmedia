"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Icon, SearchBar, SectionTitle, Skeleton } from "./ui"
import { FollowRow } from "./FollowRow"
import { useSuggestions, useTrends } from "../_hooks/queries"
import { useFormat } from "../_hooks/useFormat"

/**
 * The discovery rail.
 *
 * Both boxes are derived, not curated: **Tendencias** is a GROUP BY over the hashtags of
 * the last seven days of trinos, and **A quién seguir** is the trainers with the most
 * followers you are not already following. Neither has an editorial table behind it, and
 * neither shows anything until players have actually posted — which is honest, and is
 * why each has a real empty state rather than filler.
 *
 * There is no "Eventos en vivo" box: server events have no API, so it is deferred
 * rather than mocked (docs/smartrotom/deferred/README.md).
 */
function Box({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-rk border border-rk-line bg-rk-card">{children}</div>
}

export function RightRail() {
  const t = useTranslations("rooker")
  const { fmt } = useFormat()
  const { data: trends, isLoading: trendsLoading } = useTrends(5)
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestions(3)

  return (
    <div className="flex flex-col gap-4 py-3">
      <div className="sticky top-0 z-10 bg-rk-bg pb-1">
        <SearchBar />
      </div>

      <Box>
        <div className="px-4 pb-1.5 pt-3">
          <SectionTitle icon="trending" title={t("rightRail.trendsTitle")} />
        </div>

        {trendsLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : trends?.length ? (
          trends.map((trend) => (
            <Link
              key={trend.tag}
              href={`/smartrotom/rooker/buscar?q=${encodeURIComponent(trend.tag)}`}
              className="flex items-start justify-between gap-2.5 px-4 py-2.5 transition-colors hover:bg-rk-hover"
            >
              <div className="min-w-0">
                <div className="text-[0.75rem] text-rk-fg-subtle">{t("common.trendingInNest")}</div>
                <div className="mt-px truncate text-[0.9375rem] font-bold text-rk-fg">#{trend.tag}</div>
                <div className="text-[0.78125rem] text-rk-fg-subtle">
                  {t("common.postsCount", { formatted: fmt(trend.posts), count: trend.posts })}
                </div>
              </div>
              <Icon name="more" size={16} className="mt-1 flex-none text-rk-fg-subtle" />
            </Link>
          ))
        ) : (
          <p className="px-4 pb-4 pt-1 text-[0.84375rem] leading-relaxed text-rk-fg-subtle">
            {t("rightRail.trendsEmpty")}
          </p>
        )}
      </Box>

      <Box>
        <div className="px-4 pb-1.5 pt-3">
          <SectionTitle icon="users" title={t("common.whoToFollow")} />
        </div>

        {suggestionsLoading ? (
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-[2.625rem] w-[2.625rem] rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : suggestions?.length ? (
          suggestions.map((u) => <FollowRow key={u.uuid} user={u} />)
        ) : (
          <p className="px-4 pb-4 pt-1 text-[0.84375rem] leading-relaxed text-rk-fg-subtle">
            {t("common.followedEveryone")}
          </p>
        )}
      </Box>

      <p className="px-4 pb-4 text-[0.75rem] leading-loose text-rk-fg-subtle">
        {t("rightRail.footer")}
      </p>
    </div>
  )
}
