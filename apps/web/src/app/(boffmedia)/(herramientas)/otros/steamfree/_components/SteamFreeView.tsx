"use client"

import * as React from "react"
import { useTranslations, useFormatter } from "next-intl"
import { Kicker, SearchInput, Select, Empty, Button, Icon, Skeleton } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { useSteamFreeV3 } from "../_lib/useSteamFreeV3"
import { SfCard, SfModal, type SfStrings } from "./ui/sf-kit"

function StatChip({
  icon,
  value,
  label,
  tone,
}: {
  icon: "gift" | "bookmark" | "flame"
  value: string | number
  label: string
  tone?: "ok" | "accent"
}) {
  return (
    <span
      className={cn(
        "cut cut-edge-slant [--cut:4px]",
        "inline-flex items-center gap-[9px] border bg-panel-2 px-[12px] py-[9px] font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em]",
        tone === "ok"
          ? "border-[color-mix(in_srgb,var(--ok)_35%,var(--line-2))] text-ok"
          : tone === "accent"
            ? "border-accent-line text-accent"
            : "border-line-2 text-txt-muted",
      )}
    >
      <Icon name={icon} size={14} className={tone === "ok" ? "text-ok" : tone === "accent" ? "text-accent" : "text-txt-muted"} />
      <b
        className={
          "font-display text-[16px] font-extrabold italic leading-none " +
          (tone === "ok" ? "text-ok" : tone === "accent" ? "text-accent" : "text-txt")
        }
      >
        {value}
      </b>
      {label}
    </span>
  )
}

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
      {/* ── header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-[24px] pb-[20px] pt-[4px]">
        <div className="min-w-0">
          <Kicker>{t("kicker")}</Kicker>
          <h1 className="my-[12px] text-[clamp(38px,5vw,66px)] leading-[0.9]">
            {t("titlePre")} <em>{t("titleEm")}</em>
          </h1>
          <p className="max-w-[58ch] text-pretty text-[15px] leading-[1.5] text-txt-muted">{t("sub")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">
          <StatChip icon="gift" value={stats.count} label={t("statFree")} tone="ok" />
          <StatChip icon="bookmark" value={stats.keepCount} label={t("statKeep")} />
          {stats.valueCents > 0 && <StatChip icon="flame" value={savedValue} label={t("statValue")} tone="accent" />}
        </div>
      </header>

      {/* ── toolbar ────────────────────────────────────────────────────────── */}
      <div className="mb-[10px] mt-[4px] flex flex-wrap items-center gap-[12px]">
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
        <Button variant="ghost" icon="refresh" onClick={refresh} loading={loading}>
          {t("refresh")}
        </Button>
      </div>

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
