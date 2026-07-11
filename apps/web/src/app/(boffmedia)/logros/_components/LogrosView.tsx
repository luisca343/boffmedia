"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Empty, SearchInput, Seg, Spinner } from "@/components/boffmedia/primitives"
import { AchievementItem, type AchievementLike } from "@/components/boffmedia/ui/events"
import { useGetAchievements } from "@/hooks/events/useGetAchievements"

const FILTERS = ["all", "achievement", "medal"] as const
type Filter = (typeof FILTERS)[number]

export function LogrosView() {
  const t = useTranslations("logros")
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
      <div className="mb-6">
        <span className="mono-label">{t("kicker")}</span>
        <h1 className="mt-2 text-[clamp(44px,6vw,72px)]">{t("title")}</h1>
        <p className="mt-3 max-w-[64ch] font-body text-[16px]/[1.55] text-txt-muted">{t("lead")}</p>
        {totalPoints > 0 && (
          <p className="mt-3 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-accent">
            {t("totalPoints", { points: totalPoints.toLocaleString("es-ES") })}
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder={t("search")} className="max-w-[360px] flex-1 basis-[240px]" />
        <div className="max-w-full overflow-x-auto">
          <Seg
            options={FILTERS.map((f) => ({ value: f, label: t(`filter.${f}`) }))}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            className="w-max"
          />
        </div>
        <span className="ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-txt-muted">
          {t("count", { count: filtered.length })}
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
