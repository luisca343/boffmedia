"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../i18n"
import { Icon } from "@boffmedia/ui"
import { CxCard } from "../MewPop"
import { MewData } from "../mew-store"
import { mewCatKey } from "../mew-util"
import { CX_CAP, CX_SORT } from "./codex-config"
import { MewSearch, MewSelect, MewChips, MewEmpty } from "./controls"
import type { MewCodexModel } from "./useMewCodex"

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="border border-b-[2.5px] border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] px-[5px] py-0.5 font-mono text-[10px]/none text-[color:var(--mwp-cream)] [border-radius:5px]">{children}</kbd>
}

/**
 * The browse screen: search / sort / filters over a full-width entry grid.
 * Deliberately no left rail — the grid gets the whole page width and rides the
 * page scroll, so there is no second scroll region beside the fiche.
 */
export function MewBrowse({ codex }: { codex: MewCodexModel }) {
  const t = useToolT(MEWGENICS_NS)
  const { cat, catDef, q, setQ, view, setView, sort, setSort, filters, setFilters, filterOpts, filtered, shown, abilitiesLoading, numberedHidden, searchRef, pick, favIds, toggleFav, isFav, loadMore, canLoadMore, cursorEnabled, playSound } = codex

  const hasFiltersOrSearch = q || Object.values(filters).some((v) => v)

  const loading =
    catDef.remote && abilitiesLoading ? (
      <div className="flex items-center justify-center gap-3 py-[60px] text-[color:var(--mwp-cream-dim)]">
        <span className="h-[22px] w-[22px] animate-spin border-[3px] border-solid border-[color:var(--mwp-nline)] border-t-[color:var(--mwp-red)] [border-radius:50%] motion-reduce:animate-none" />
        {t("roster.loadingAbilities")}
      </div>
    ) : null

  const error =
    catDef.remote && MewData.remoteState.abilities === "error" ? (
      <MewEmpty
        icon="alert"
        title={t("roster.abilitiesErrorTitle")}
        lead={t("roster.abilitiesErrorLead")}
      />
    ) : null

  const empty =
    filtered.length === 0 && !loading ? (
      <MewEmpty
        icon="search"
        title={t("roster.emptyTitle")}
        lead={t("roster.emptyLead")}
        action={
          hasFiltersOrSearch
            ? {
                label: t("roster.clearFilters"),
                onClick: () => {
                  setQ("")
                  setFilters({})
                },
              }
            : undefined
        }
      />
    ) : null

  const catFavCount = filtered.filter((r) => isFav(r)).length

  return (
    <div className="px-[var(--mew-gutter)] pb-16 pt-5">
      {/* toolbar: search + sort + view toggle */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="min-w-[220px] flex-1 basis-[280px]">
          <MewSearch
            ref={searchRef}
            value={q}
            onChange={setQ}
            placeholder={t("roster.searchPlaceholder", { category: t(mewCatKey(cat, "label")).toLowerCase() })}
            label={t("roster.searchLabel", { category: t(mewCatKey(cat, "label")).toLowerCase() })}
            clearLabel={t("roster.clearSearch")}
          />
        </div>
        {CX_SORT[cat] && CX_SORT[cat].length > 0 && (
          <MewSelect
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
              className={
                "grid h-[40px] w-[44px] place-items-center border-2 border-solid [border-radius:var(--wob-sm)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 active:translate-y-0.5 active:[box-shadow:0_1px_0_var(--mwp-shadow-xs)] " +
                (view === vw
                  ? "border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [box-shadow:0_3px_0_var(--mwp-shadow-sm)]"
                  : "border-dashed border-[color:var(--mwp-nline)] bg-transparent text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink-soft)]")
              }
            >
              <Icon name={vw === "grid" ? "grid" : "list"} size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* category intro */}
      {catDef && (
        <div className="mb-3 text-[12.5px]/[1.4] font-medium text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-hand)] line-clamp-2">
          {t(mewCatKey(cat, "desc"))}
        </div>
      )}

      {/* filter chip groups */}
      {filterOpts.length > 0 && (
        <div className="mb-4 grid gap-3">
          {filterOpts.map((fo) => (
            <MewChips
              key={fo.key}
              label={fo.label}
              value={filters[fo.key] || ""}
              options={[{ value: "", label: t("roster.filterAll") }, ...fo.options]}
              onChange={(v) => setFilters((f) => ({ ...f, [fo.key]: v as string }))}
            />
          ))}
        </div>
      )}

      {/* favorites toggle chip */}
      {catFavCount > 0 && (
        <div className="mb-4">
          <MewChips
            label={t("roster.filters")}
            value={filters.__fav || ""}
            options={[
              { value: "", label: t("roster.filterAll") },
              { value: "1", label: t("roster.favoritesLabel", { count: catFavCount }) },
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, __fav: v as string }))}
          />
        </div>
      )}

      {(numberedHidden > 0 || filters.__numbered === "1") && (
        <div className="mb-4">
          <MewChips
            label={t("roster.mutationFold")}
            value={filters.__numbered || ""}
            options={[
              { value: "", label: t("roster.mutationNamedOnly") },
              { value: "1", label: t("roster.mutationShowAll") },
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, __numbered: v as string }))}
          />
        </div>
      )}

      {/* count + shortcut hints */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-[color:var(--mwp-nline)] pb-2.5" aria-live="polite">
        <div className="text-[11px]/[1.3] tracking-[0.06em] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-disp)]">
          {t("roster.count", { count: filtered.length, singular: t(mewCatKey(cat, "singular")), label: t(mewCatKey(cat, "label")).toLowerCase() })}
          {filtered.length > CX_CAP ? t("roster.showingCap", { n: CX_CAP }) : ""}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5 text-[var(--mwp-fs-tiny)]/[1.5] font-medium text-[color:var(--mwp-cream-dim)] max-[760px]:hidden">
          <Kbd>←</Kbd><Kbd>→</Kbd> {t("roster.kbdCategory")} · <Kbd>/</Kbd> {t("roster.kbdSearch")}
        </div>
      </div>

      {loading ? (
        loading
      ) : error ? (
        <div className="py-6">{error}</div>
      ) : empty ? (
        <div className="py-6">{empty}</div>
      ) : (
        <>
          <div
            className={
              view === "grid"
                ? "mt-4 grid gap-x-3 gap-y-4 [grid-template-columns:repeat(auto-fill,minmax(186px,1fr))] max-[520px]:[grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] [animation:mew-fade-rise_160ms_ease-out]"
                : "mt-4 grid gap-2 grid-cols-1 [animation:mew-fade-rise_160ms_ease-out]"
            }
          >
            {shown.map((r, idx) => (
              <div key={r.id} style={{ "--card-delay": `${Math.min(idx, 11) * 18}ms` } as React.CSSProperties} className="[animation:mew-card-stagger_200ms_ease-out_forwards] [animation-delay:var(--card-delay)]">
                <CxCard cat={cat} rec={r} onOpen={() => {
                  playSound("select")
                  pick(r.id)
                }} view={view} cursorEnabled={cursorEnabled} playSound={playSound} />
              </div>
            ))}
          </div>

          {canLoadMore && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={loadMore}
                className="border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-6 py-2.5 text-[13px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] [box-shadow:0_3px_0_var(--mwp-shadow-sm)] transition-all hover:translate-y-[-2px] hover:[box-shadow:0_5px_0_var(--mwp-shadow-sm)] active:translate-y-1 active:[box-shadow:0_1px_0_var(--mwp-shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
              >
                {t("roster.loadMore")}
              </button>
              <p className="text-[11px]/[1.4] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-hand)]">
                {t("roster.loadMoreHint", { remaining: filtered.length - shown.length })}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
