"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Kicker, SearchInput, Seg, Select, Empty, Button, Icon, Skeleton } from "@/components/boffmedia/primitives"
import { useKeysV3 } from "../_lib/useKeysV3"
import { KvCard, KeyModal, type KvModalStrings } from "./ui/kv-kit"

function StatChip({ icon, value, label, tone }: { icon: "layers" | "bookmark" | "check"; value: number; label: string; tone?: "ok" | "used" }) {
  return (
    <span
      style={{ clipPath: "polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)" }}
      className={
        "inline-flex items-center gap-[9px] border bg-panel-2 px-[12px] py-[9px] font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em] " +
        (tone === "ok" ? "border-[color-mix(in_srgb,var(--ok)_35%,var(--line-2))] text-ok" : "border-line-2 text-txt-muted")
      }
    >
      <Icon name={icon} size={14} className={tone === "ok" ? "text-ok" : tone === "used" ? "text-txt-dim" : "text-txt-muted"} />
      <b className={"font-display text-[16px] font-extrabold italic leading-none " + (tone === "ok" ? "text-ok" : "text-txt")}>{value}</b>
      {label}
    </span>
  )
}

export function KeysView() {
  const t = useTranslations("otros.keysApp")
  const {
    q, setQ, filter, setFilter, sort, setSort, list, counts, loading,
    selected, game, modalOpen, detailLoading, open, close, resetFilters,
  } = useKeysV3()

  const modalStrings: KvModalStrings = {
    developer: t("developer"),
    publisher: t("publisher"),
    release: t("release"),
    platforms: t("platforms"),
    genres: t("genres"),
    officialSite: t("officialSite"),
    free: t("free"),
    freeNote: t("freeNote"),
    priceUnknown: t("priceUnknown"),
    priceNow: t("priceNow"),
    priceSteam: t("priceSteam"),
    tabInfo: t("tabInfo"),
    tabPrice: t("tabPrice"),
    tabMedia: t("tabMedia"),
    viewSteam: t("viewSteam"),
    loading: t("detailLoading"),
    stock: t("stock"),
    available: t("available"),
    delivered: t("delivered"),
  }

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
          <StatChip icon="layers" value={counts.total} label={t("statTotal")} />
          <StatChip icon="bookmark" value={counts.available} label={t("statAvailable")} tone="ok" />
          <StatChip icon="check" value={counts.given} label={t("statDelivered")} tone="used" />
        </div>
      </header>

      {/* ── toolbar ────────────────────────────────────────────────────────── */}
      <div className="mb-[22px] mt-[4px] flex flex-wrap items-center gap-[12px]">
        <SearchInput value={q} onChange={setQ} placeholder={t("searchPlaceholder")} className="min-w-[230px] flex-1" />
        <Seg
          value={filter}
          onChange={(v) => setFilter(v as "available" | "all")}
          options={[
            { value: "available", label: t("filterAvailable") },
            { value: "all", label: t("filterAll") },
          ]}
        />
        <Select
          value={sort}
          onChange={(v) => setSort(v as typeof sort)}
          ariaLabel={t("sortLabel")}
          className="w-auto min-w-[160px]"
          options={[
            { value: "estado", label: t("sortEstado") },
            { value: "stock", label: t("sortStock") },
            { value: "nombre", label: t("sortNombre") },
          ]}
        />
      </div>

      {/* ── grid ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[16px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-line bg-panel">
              <Skeleton h={130} className="border-0" />
              <div className="flex flex-col gap-[10px] p-[16px]">
                <Skeleton w="70%" h={18} />
                <Skeleton w="40%" h={12} />
              </div>
            </div>
          ))}
        </div>
      ) : list.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[16px] max-[600px]:grid-cols-1">
          {list.map((item) => (
            <KvCard
              key={`${item.name}-${item.given}`}
              item={item}
              cta={t("cardCta")}
              availableLabel={t("available")}
              deliveredLabel={t("delivered")}
              onOpen={open}
            />
          ))}
        </div>
      ) : (
        <Empty icon="key" title={t("emptyTitle")} lead={q ? t("emptySearch", { q }) : t("emptyLead")}>
          <Button variant="pri" icon="refresh" onClick={resetFilters}>
            {t("clearFilters")}
          </Button>
        </Empty>
      )}

      {modalOpen && selected && (
        <KeyModal item={selected} game={game} loading={detailLoading} onClose={close} t={modalStrings} />
      )}
    </main>
  )
}
