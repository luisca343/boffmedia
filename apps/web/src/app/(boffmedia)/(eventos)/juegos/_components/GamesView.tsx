"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Empty, SearchInput, Seg, Spinner, ToolBar, ToolHeader } from "@boffmedia/ui"
import { GameCard, type GameLike } from "@/components/boffmedia/ui/events"
import { useGetGames } from "@/hooks/events/useGetGames"

const FILTERS = ["all", "active"] as const
type Filter = (typeof FILTERS)[number]

export function GamesView() {
  const t = useTranslations("juegos")
  const { games, error, isLoading, refetch } = useGetGames()
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")

  const filtered = React.useMemo(() => {
    const list = (Array.isArray(games) ? games : []) as GameLike[]
    const needle = q.trim().toLowerCase()
    return list.filter((g) => {
      const active = !g.deletedAt
      if (filter === "active" && !active) return false
      if (needle && !`${g.title} ${g.description ?? ""}`.toLowerCase().includes(needle)) return false
      return true
    })
  }, [games, q, filter])

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <ToolHeader title={t("title")} sub={t("lead")} />

      <ToolBar note={t("count", { count: filtered.length })}>
        <SearchInput value={q} onChange={setQ} placeholder={t("search")} className="max-w-[360px] flex-1 basis-[240px]" />
        <Seg
          options={FILTERS.map((f) => ({ value: f, label: t(`filter.${f}`) }))}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />
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
        <Empty icon="gamepad" title={t("empty.title")} lead={t("empty.lead")} />
      ) : (
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))] max-[720px]:grid-cols-1">
          {filtered.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </main>
  )
}
