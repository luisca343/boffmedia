"use client"

import * as React from "react"
import { useTranslations, useFormatter } from "next-intl"
import { SearchInput, Select, Empty, Button, Icon, Skeleton, StatChip, ToolBar, ToolBarSpacer, ToolHeader } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { useSteamFreeV3 } from "../_lib/useSteamFreeV3"
import { SfCard, SfModal, type SfStrings } from "./ui/sf-kit"

export function SteamFreeView() {
  const t = useTranslations("otros.steamfreeApp")
  const format = useFormatter()
  const {
    q,
    setQ,
    sort,
    setSort,
    list,
    stats,
    now,
    loading,
    error,
    refresh,
    fetchedAt,
    searchUrl,
    selected,
    detail,
    modalOpen,
    detailLoading,
    open,
    close,
    clearSearch,
  } = useSteamFreeV3()

  const strings: SfStrings = {
    claim: t("claim"),
    details: t("details"),
    close: t("close"),
    endsIn: t("endsIn"),
    endsUnknown: t("endsUnknown"),
    ended: t("ended"),
    deadline: t("deadline"),
    keep: t("keep"),
    keepNote: t("keepNote"),
    weekend: t("weekend"),
    weekendNote: t("weekendNote"),
    saves: t("saves"),
    reviews: t("reviews"),
    noReviews: t("noReviews"),
    developer: t("developer"),
    publisher: t("publisher"),
    release: t("release"),
    platforms: t("platforms"),
    genres: t("genres"),
    officialSite: t("officialSite"),
    tabInfo: t("tabInfo"),
    tabMedia: t("tabMedia"),
    detailLoading: t("detailLoading"),
    viewSteam: t("viewSteam"),
    mediaN: (n: number) => t("mediaN", { n }),
  }

  const savedValue = format.number(stats.valueCents / 100, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })

  return (
    <main className="pb-[10px]">
      <ToolHeader
        eyebrow={t("kicker")}
        title={<>{t("titlePre")} <em>{t("titleEm")}</em></>}
        sub={t("sub")}
        meta={
          <>
            <StatChip icon="gift" value={stats.count} label={t("statFree")} tone="ok" />
            <StatChip icon="bookmark" value={stats.keepCount} label={t("statKeep")} />
            {stats.valueCents > 0 && <StatChip icon="flame" value={savedValue} label={t("statValue")} tone="accent" />}
          </>
        }
      />

      <ToolBar className="mb-[10px]">
        <SearchInput value={q} onChange={setQ} placeholder={t("searchPlaceholder")} className="min-w-[230px] flex-1" />
        <Select
          value={sort}
          onChange={(v) => setSort(v as typeof sort)}
          ariaLabel={t("sortLabel")}
          className="w-auto min-w-[170px]"
          options={[
            { value: "ends", label: t("sortEnds") },
            { value: "value", label: t("sortValue") },
            { value: "rating", label: t("sortRating") },
            { value: "name", label: t("sortName") },
          ]}
        />
        <ToolBarSpacer />
        <Button variant="ghost" icon="refresh" onClick={refresh} loading={loading}>
          {t("refresh")}
        </Button>
      </ToolBar>

      {/* Steam is the authority here, so say when this snapshot was taken. */}
      <div className="mb-[22px] flex flex-wrap items-center gap-[10px] font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">
        {fetchedAt && (
          <span className="inline-flex items-center gap-[6px]">
            <Icon name="clock" size={12} />
            {t("updated", { time: format.dateTime(new Date(fetchedAt), { hour: "2-digit", minute: "2-digit" }) })}
          </span>
        )}
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-[6px] text-txt-muted underline-offset-4 transition-colors duration-[120ms] hover:text-accent hover:underline"
          >
            <Icon name="steam" size={12} />
            {t("sourceLink")}
          </a>
        )}
      </div>

      {/* ── grid ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[16px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-line bg-panel">
              <Skeleton h={150} className="border-0" />
              <div className="flex flex-col gap-[10px] p-[16px]">
                <Skeleton w="70%" h={18} />
                <Skeleton w="45%" h={12} />
                <Skeleton w="35%" h={24} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Empty icon="alert" title={t("errorTitle")} lead={t("errorLead")}>
          <Button variant="pri" icon="refresh" onClick={refresh}>
            {t("retry")}
          </Button>
        </Empty>
      ) : list.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[16px] max-[600px]:grid-cols-1">
          {list.map((game) => (
            <SfCard key={game.steamID} game={game} now={now} t={strings} onOpen={open} />
          ))}
        </div>
      ) : q ? (
        <Empty icon="search" title={t("emptySearchTitle")} lead={t("emptySearch", { q })}>
          <Button variant="pri" icon="refresh" onClick={clearSearch}>
            {t("clearSearch")}
          </Button>
        </Empty>
      ) : (
        <Empty icon="gift" title={t("emptyTitle")} lead={t("emptyLead")}>
          <Button variant="ghost" icon="refresh" onClick={refresh}>
            {t("refresh")}
          </Button>
        </Empty>
      )}

      {modalOpen && selected && (
        <SfModal game={selected} detail={detail} loading={detailLoading} now={now} t={strings} onClose={close} />
      )}
    </main>
  )
}
