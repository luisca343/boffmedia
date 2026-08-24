"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { SearchInput, Seg, Select, Empty, Button, Skeleton, StatChip, ToolBar, ToolHeader } from "@boffmedia/ui"
import { useKeysV3 } from "../_lib/useKeysV3"
import { cn } from "@/lib/utils"
import { KvCard, KeyModal, type KvModalStrings } from "./ui/kv-kit"

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
      <ToolHeader
        eyebrow={t("kicker")}
        title={<>{t("titlePre")} <em>{t("titleEm")}</em></>}
        sub={t("sub")}
        meta={
          <>
            <StatChip icon="layers" value={counts.total} label={t("statTotal")} />
            <StatChip icon="bookmark" value={counts.available} label={t("statAvailable")} tone="ok" />
            <StatChip icon="check" value={counts.given} label={t("statDelivered")} tone="used" />
          </>
        }
      />

      <ToolBar className="mb-[22px]" note={t("resultCount", { n: list.length })}>
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
      </ToolBar>

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
