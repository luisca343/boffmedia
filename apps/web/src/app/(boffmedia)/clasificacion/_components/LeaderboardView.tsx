"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Empty, IconButton, Pagination, SearchInput, Seg, Spinner } from "@/components/boffmedia/primitives"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import { useFormat } from "@/lib/useFormat"
import { LeaderRow, type LeaderRowData, type SortKey } from "./LeaderRow"

const PER_PAGE = 12

const METRIC: Record<SortKey, (e: LeaderRowData) => number> = {
  points: (e) => Number(e.totalPoints) || 0,
  medals: (e) => Number(e.medalCount) || 0,
  achievements: (e) => Number(e.achievementCount) || 0,
}

export function LeaderboardView() {
  const t = useTranslations("leaderboard")
  const { number: formatPoints } = useFormat()
  const { leaderboards, error, isLoading, refetch } = useGetLeaderboards()
  const [q, setQ] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("points")
  const [desc, setDesc] = React.useState(true)
  const [page, setPage] = React.useState(1)

  const rows = React.useMemo(() => {
    const list = (Array.isArray(leaderboards) ? leaderboards : []) as LeaderRowData[]
    const needle = q.trim().toLowerCase()
    const filtered = needle ? list.filter((e) => (e.nickname || "").toLowerCase().includes(needle)) : [...list]
    const dir = desc ? -1 : 1
    filtered.sort((a, b) => (METRIC[sort](a) - METRIC[sort](b)) * dir)
    return filtered
  }, [leaderboards, q, sort, desc])

  React.useEffect(() => setPage(1), [q, sort, desc])

  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE))
  const clampedPage = Math.min(page, pageCount)
  const start = (clampedPage - 1) * PER_PAGE
  const pageRows = rows.slice(start, start + PER_PAGE)

  const labels = { points: t("sort.points"), medals: t("sort.medals"), achievements: t("sort.achievements") }

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <div className="mb-6">
        <span className="mono-label">{t("kicker")}</span>
        <h1 className="mt-2 text-[clamp(40px,5vw,60px)]">{t("title")}</h1>
        <p className="mt-3 max-w-[64ch] font-body text-[15px]/[1.6] text-txt-muted">{t("lead")}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder={t("search")} className="max-w-[360px] flex-1 basis-[240px]" />
        <Seg
          options={[
            { value: "points", label: t("sort.points") },
            { value: "medals", label: t("sort.medals") },
            { value: "achievements", label: t("sort.achievements") },
          ]}
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
        />
        <IconButton
          name="chevronDown"
          label={t("sortDir")}
          onClick={() => setDesc((d) => !d)}
          className={cn("transition-transform duration-[140ms]", !desc && "rotate-180")}
        />
        <span className="ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-txt-muted">
          {t("count", { count: total })}
        </span>
      </div>

      {isLoading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner />
        </div>
      ) : error ? (
        <Empty icon="alert" title={t("error.title")}>
          <Button icon="refresh" onClick={() => refetch()}>
            {t("error.retry")}
          </Button>
        </Empty>
      ) : total === 0 ? (
        <Empty icon="search" title={t("empty.title")} lead={t("empty.lead")} />
      ) : (
        <>
          <div className="overflow-hidden border border-solid border-line bg-panel cut-corner">
            {pageRows.map((e, i) => (
              <LeaderRow
                key={(e as { participantId?: number }).participantId ?? start + i}
                position={start + i + 1}
                entry={e}
                activeSort={sort}
                labels={labels}
                formatPoints={formatPoints}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-txt-dim">
                {t("showing", { from: start + 1, to: Math.min(start + PER_PAGE, total), total })}
              </span>
              <Pagination page={clampedPage} total={pageCount} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </main>
  )
}
