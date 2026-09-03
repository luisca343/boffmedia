"use client"

import * as React from "react"
import { SearchInput, Select, Empty, Button, Icon, Skeleton, StatChip, ToolBar, ToolBarSpacer, ToolHeader, cn, useFormat } from "@boffmedia/ui"
import { useSteamFreeV3 } from "./useSteamFreeV3"
import { useToolT, STEAMFREE_NS } from "../i18n"
import { SfCard, SfModal, type SfStrings } from "./sf-kit"

export function SteamFreeView() {
  const t = useToolT(STEAMFREE_NS)
  const format = useFormat()
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

  const currencyFormatter = new Intl.NumberFormat(format.intlLocale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
  const savedValue = currencyFormatter.format(stats.valueCents / 100)

  return (
    <main className="pb-[0.625rem]">
      <ToolHeader
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

      <ToolBar className="mb-[0.625rem]">
        <SearchInput value={q} onChange={setQ} placeholder={t("searchPlaceholder")} className="min-w-[14.375rem] flex-1" />
        <Select
          value={sort}
          onChange={(v) => setSort(v as typeof sort)}
          ariaLabel={t("sortLabel")}
          className="w-auto min-w-[10.625rem]"
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
      <div className="mb-[1.375rem] flex flex-wrap items-center gap-[0.625rem] font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">
        {fetchedAt && (
          <span className="inline-flex items-center gap-[0.375rem]">
            <Icon name="clock" size={12} />
            {t("updated", { time: format.time(new Date(fetchedAt), { hour: "2-digit", minute: "2-digit" }) })}
          </span>
        )}
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-[0.375rem] text-txt-muted underline-offset-4 transition-colors duration-[120ms] hover:text-accent hover:underline"
          >
            <Icon name="steam" size={12} />
            {t("sourceLink")}
          </a>
        )}
      </div>

      {/* ── grid ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-[1rem]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-line bg-panel">
              <Skeleton h={150} className="border-0" />
              <div className="flex flex-col gap-[0.625rem] p-[1rem]">
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-[1rem] max-[600px]:grid-cols-1">
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
