"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { EmptyState, FeedSkeleton, SearchBar, SectionTitle, Skeleton } from "../_components/ui"
import { PostCard } from "../_components/PostCard"
import { FollowRow } from "../_components/FollowRow"
import { useSearch, useSuggestions, useTrends } from "../_hooks/queries"
import { useFormat } from "../_hooks/useFormat"

/**
 * Explorar — discovery when there is no query, search results when there is.
 *
 * The query lives in the URL (`?q=`), so a search is linkable and survives a reload;
 * the field seeds itself from it and then searches as you type without pushing history
 * on every keystroke.
 */
function SearchInner() {
  const t = useTranslations("rooker")
  const { fmt } = useFormat()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("q") ?? "")
  const term = q.trim()

  const { data: results, isLoading: searching } = useSearch(term)
  const { data: trends, isLoading: trendsLoading } = useTrends(10)
  const { data: suggestions } = useSuggestions(5)

  const searchable = term.length >= 2

  return (
    <div>
      <div className="sticky top-0 z-30 border-b border-rk-line bg-rk-nav px-3.5 py-2.5 backdrop-blur-md">
        <SearchBar defaultValue={q} onChange={setQ} />
      </div>

      {!searchable ? (
        <>
          <div className="px-4 pb-1 pt-3.5">
            <SectionTitle icon="trending" title={t("search.trendsTitle")} />
          </div>

          {trendsLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : trends?.length ? (
            trends.map((trend) => (
              <Link
                key={trend.tag}
                href={`/smartrotom/rooker/buscar?q=${encodeURIComponent(trend.tag)}`}
                onClick={() => setQ(trend.tag)}
                className="block px-4 py-2.5 transition-colors hover:bg-rk-hover"
              >
                <div className="text-[0.75rem] text-rk-fg-subtle">{t("common.trendingInNest")}</div>
                <div className="text-[0.9375rem] font-bold text-rk-fg">#{trend.tag}</div>
                <div className="text-[0.78125rem] text-rk-fg-subtle">
                  {t("common.postsCount", { formatted: fmt(trend.posts), count: trend.posts })}
                </div>
              </Link>
            ))
          ) : (
            <p className="px-4 pb-5 pt-1 text-[0.875rem] leading-relaxed text-rk-fg-subtle">
              {t("search.trendsEmpty")}
            </p>
          )}

          <div className="border-t border-rk-line px-4 pb-1 pt-3.5">
            <SectionTitle icon="users" title={t("common.whoToFollow")} />
          </div>
          {suggestions?.length ? (
            suggestions.map((u) => <FollowRow key={u.uuid} user={u} />)
          ) : (
            <p className="px-4 pb-5 pt-1 text-[0.875rem] text-rk-fg-subtle">{t("common.followedEveryone")}</p>
          )}
        </>
      ) : searching ? (
        <FeedSkeleton rows={4} />
      ) : results && (results.users.length || results.posts.length || results.tags.length) ? (
        <>
          {results.users.length > 0 && (
            <>
              <div className="px-4 pb-1 pt-3.5">
                <SectionTitle icon="users" title={t("search.resultsUsersTitle")} />
              </div>
              {results.users.map((u) => (
                <FollowRow key={u.uuid} user={u} />
              ))}
            </>
          )}

          {results.tags.length > 0 && (
            <>
              <div className="border-t border-rk-line px-4 pb-1 pt-3.5">
                <SectionTitle icon="hash" title={t("search.resultsTagsTitle")} />
              </div>
              {results.tags.map((tag) => (
                <Link
                  key={tag.tag}
                  href={`/smartrotom/rooker/buscar?q=${encodeURIComponent(tag.tag)}`}
                  onClick={() => setQ(tag.tag)}
                  className="block px-4 py-2.5 transition-colors hover:bg-rk-hover"
                >
                  <div className="text-[0.9375rem] font-bold text-rk-fg">#{tag.tag}</div>
                  <div className="text-[0.78125rem] text-rk-fg-subtle">
                    {t("common.postsCount", { formatted: fmt(tag.posts), count: tag.posts })}
                  </div>
                </Link>
              ))}
            </>
          )}

          {results.posts.length > 0 && (
            <>
              <div className="border-t border-rk-line px-4 pb-1 pt-3.5">
                <SectionTitle icon="feather" title={t("search.resultsPostsTitle")} />
              </div>
              {results.posts.map((p, i) => (
                <PostCard key={p.id} post={p} last={i === results.posts.length - 1} />
              ))}
            </>
          )}
        </>
      ) : (
        <EmptyState
          icon="search"
          title={t("search.noResults.title", { term })}
          body={t("search.noResults.body")}
        />
      )}
    </div>
  )
}

export default function BuscarPage() {
  // `useSearchParams` suspends during prerender; without this boundary the whole route
  // would opt out of static generation with a build-time warning.
  return (
    <Suspense fallback={<FeedSkeleton rows={4} />}>
      <SearchInner />
    </Suspense>
  )
}
