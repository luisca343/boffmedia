"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Empty, SearchInput, Seg, Spinner, StatChip, ToolBar, ToolHeader } from "@boffmedia/ui"
import { AchievementItem, type AchievementLike } from "@/components/boffmedia/ui/events"
import { useGetAchievements } from "@/hooks/events/useGetAchievements"
import { useFormat } from "@boffmedia/ui/useFormat"

const FILTERS = ["all", "achievement", "medal"] as const
type Filter = (typeof FILTERS)[number]

export function LogrosView() {
  const t = useTranslations("logros")
  const { number: formatNumber } = useFormat()
  const { achievements, error, isLoading, refetch } = useGetAchievements()
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")

  const list = (Array.isArray(achievements) ? achievements : []) as AchievementLike[]

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    return list
      .filter((a) => {
        if (filter === "medal" && a.itemType !== "medal") return false
        if (filter === "achievement" && a.itemType === "medal") return false
        if (needle && !`${a.name} ${a.eventName ?? ""}`.toLowerCase().includes(needle)) return false
        return true
      })
      .sort((a, b) => (b.points || 0) - (a.points || 0))
  }, [list, q, filter])

  const totalPoints = React.useMemo(() => list.reduce((n, a) => n + (a.points || 0), 0), [list])

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <ToolHeader
        title={t("title")}
        sub={t("lead")}
        meta={
          totalPoints > 0 ? (
            <StatChip icon="star" value={formatNumber(totalPoints)} label={t("statPoints")} tone="ok" />
          ) : undefined
        }
      />

      <ToolBar note={t("count", { count: filtered.length })}>
        <SearchInput value={q} onChange={setQ} placeholder={t("search")} className="max-w-[360px] flex-1 basis-[240px]" />
        <div className="max-w-full overflow-x-auto">
          <Seg
            options={FILTERS.map((f) => ({ value: f, label: t(`filter.${f}`) }))}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            className="w-max"
          />
        </div>
      </ToolBar>

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
      ) : filtered.length === 0 ? (
        <Empty icon="star" title={t("empty.title")} lead={t("empty.lead")} />
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(420px,1fr))] max-[720px]:grid-cols-1">
          {filtered.map((a) => (
            <AchievementItem key={a.id} achievement={a} showEvent />
          ))}
        </div>
      )}
    </main>
  )
}
