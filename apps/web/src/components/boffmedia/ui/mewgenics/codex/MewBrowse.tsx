"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ChipGroup, Empty, Icon, SearchInput, Select } from "@boffmedia/ui"
import { CxCard } from "../MewPop"
import { MewData } from "../mew-store"
import { mewCatKey } from "../mew-util"
import { CX_CAP, CX_SORT } from "./codex-config"
import type { MewCodexModel } from "./useMewCodex"

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="border border-b-[2.5px] border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] px-[5px] py-0.5 font-mono text-[10px]/none text-[color:var(--mwp-cream)] [border-radius:5px]">{children}</kbd>
}

/**
 * The browse screen: search / sort / filters over a full-width entry grid.
 * Replaces the old left rail — the grid gets the whole page width and rides the
 * page scroll, so there is no second scroll region beside the fiche.
 */
export function MewBrowse({ codex }: { codex: MewCodexModel }) {
  const t = useTranslations("mewgenics")
  const { cat, catDef, q, setQ, view, setView, sort, setSort, filters, setFilters, filterOpts, filtered, shown, abilitiesLoading, searchRef, pick } = codex

  const empty =
    catDef.remote && abilitiesLoading ? (
      <div className="flex items-center justify-center gap-3 py-[60px] text-[color:var(--mwp-cream-dim)]">
        <span className="h-[22px] w-[22px] animate-spin border-[3px] border-solid border-[color:var(--mwp-nline)] border-t-[color:var(--mwp-red)] [border-radius:50%] motion-reduce:animate-none" />
        {t("roster.loadingAbilities")}
      </div>
    ) : catDef.remote && MewData.remoteState.abilities === "error" ? (
      <Empty icon="alert" title={t("roster.abilitiesErrorTitle")} lead={t("roster.abilitiesErrorLead")} />
    ) : (
      <Empty icon="search" title={t("roster.emptyTitle")} lead={t("roster.emptyLead")} />
    )

  return (
    <div className="px-[clamp(16px,2.4vw,36px)] pb-16 pt-5">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div ref={searchRef} className="min-w-[220px] flex-1 basis-[280px]">
          <SearchInput value={q} onChange={setQ} placeholder={t("roster.searchPlaceholder", { category: t(mewCatKey(cat, "label")).toLowerCase() })} size="sm" />
        </div>
        {CX_SORT[cat] && (
          <Select
            value={sort}
            onChange={setSort}
            options={CX_SORT[cat].map((s) => ({ value: s.v, label: t(s.label) }))}
            ariaLabel={t("roster.sortLabel")}
            className="w-[190px] flex-none max-[520px]:flex-1"
          />
        )}
        <div className="flex flex-none gap-[5px]">
          {(["grid", "list"] as const).map((vw) => (
            <button
              key={vw}
              type="button"
              aria-label={vw === "grid" ? t("roster.viewGrid") : t("roster.viewList")}
              aria-pressed={view === vw}
              onClick={() => setView(vw)}
              className={"grid h-[38px] w-[40px] place-items-center border-[1.5px] [border-radius:var(--wob-sm)] transition-colors " + (view === vw ? "border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [box-shadow:0_2px_0_rgba(0,0,0,0.3)]" : "border-dashed border-[color:var(--mwp-nline)] bg-transparent text-[color:var(--mwp-cream-dim)]")}
            >
              <Icon name={vw === "grid" ? "grid" : "list"} size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* filter chip groups */}
      {filterOpts.length > 0 && (
        <div className="mt-3 grid gap-2">
          {filterOpts.map((fo) => (
            <ChipGroup
              key={fo.key}
              label={fo.label}
              value={filters[fo.key] || ""}
              options={[{ value: "", label: t("roster.filterAll") }, ...fo.options]}
              onChange={(v) => setFilters((f) => ({ ...f, [fo.key]: v as string }))}
            />
          ))}
        </div>
      )}

      {/* count + shortcut hints */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-[color:var(--mwp-nline)] pb-2.5">
        <div className="text-[11px]/[1.3] tracking-[0.06em] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-disp)]">
          {t("roster.count", { count: filtered.length, singular: t(mewCatKey(cat, "singular")), label: t(mewCatKey(cat, "label")).toLowerCase() })}
          {filtered.length > CX_CAP ? t("roster.showingCap", { n: CX_CAP }) : ""}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5 text-[10.5px]/[1.5] font-medium text-[color:var(--mwp-cream-dim)] opacity-85 max-[760px]:hidden">
          <Kbd>←</Kbd><Kbd>→</Kbd> {t("roster.kbdCategory")} · <Kbd>/</Kbd> {t("roster.kbdSearch")}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-6">{empty}</div>
      ) : (
        <div
          className={
            view === "grid"
              ? "mt-4 grid gap-x-3 gap-y-4 [grid-template-columns:repeat(auto-fill,minmax(178px,1fr))] max-[520px]:[grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]"
              : "mt-4 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]"
          }
        >
          {shown.map((r) => (
            <CxCard key={r.id} cat={cat} rec={r} onOpen={() => pick(r.id)} view={view} />
          ))}
        </div>
      )}

      {filtered.length > CX_CAP && (
        <div className="mt-5 text-center text-[12px]/[1.5] font-medium italic text-[color:var(--mwp-cream-dim)]">{t("roster.overflowHint")}</div>
      )}
    </div>
  )
}
