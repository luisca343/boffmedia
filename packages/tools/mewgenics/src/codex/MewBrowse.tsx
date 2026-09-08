"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../i18n"
import { CxCard } from "../MewPop"
import { MewData } from "../mew-store"
import { mewCatKey } from "../mew-util"
import { CX_CAP, CX_SORT } from "./codex-config"
import { MewSearch, MewSelect, MewChips, MewEmpty } from "./controls"
import { MewButton, MewIconButton, MewLoading } from "../mew-kit"
import { MewRecordRow } from "./MewRecordRow"
import type { MewCodexModel } from "./useMewCodex"

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="border border-b-[2.5px] border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] px-[0.3125rem] py-0.5 font-mono text-[0.625rem]/none text-[color:var(--mwp-cream)] [border-radius:5px]">{children}</kbd>
}

/**
 * The browse screen: search / sort / filters over a full-width entry grid.
 * Deliberately no left rail — the grid gets the whole page width and rides the
 * page scroll, so there is no second scroll region beside the fiche.
 */
export function MewBrowse({ codex }: { codex: MewCodexModel }) {
  const t = useToolT(MEWGENICS_NS)
  const { cat, catDef, q, setQ, view, setView, density, setDensity, sort, setSort, filters, setFilters, filterOpts, filtered, shown, abilitiesLoading, numberedHidden, searchRef, pick, isFav, loadMore, canLoadMore, cursorEnabled, playSound } = codex
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const filtersId = React.useId()

  const activeFilterCount = Object.values(filters).filter((v) => v).length
  const catFavCount = filtered.filter((r) => isFav(r)).length
  const hasFilterControls = filterOpts.length > 0 || catFavCount > 0 || numberedHidden > 0 || filters.__fav === "1" || filters.__numbered === "1"
  const hasFiltersOrSearch = q || activeFilterCount > 0

  React.useEffect(() => {
    if (activeFilterCount > 0) setFiltersOpen(true)
  }, [activeFilterCount])

  const loading =
    catDef.remote && abilitiesLoading ? (
      <MewLoading label={t("roster.loadingAbilities")} />
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

  return (
    <div className="px-[var(--mew-gutter)] pb-16 pt-5">
      {/* toolbar: search + sort + view toggle */}
      <div className="mew-browse__toolbar mb-4 flex flex-wrap items-center gap-2.5">
        <div className="min-w-[13.75rem] flex-1 basis-[17.5rem]">
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
            className="w-[11.875rem] flex-none max-[520px]:flex-1"
          />
        )}
        <MewSelect
          value={density}
          onChange={(value) => setDensity(value as "compact" | "comfortable")}
          options={[
            { value: "comfortable", label: t("roster.densityComfortable") },
            { value: "compact", label: t("roster.densityCompact") },
          ]}
          ariaLabel={t("roster.densityLabel")}
          className="w-[8.5rem] flex-none max-[520px]:flex-1"
        />
        <div className="mew-browse__view-toggle flex flex-none gap-[0.3125rem]">
          {(["grid", "list"] as const).map((vw) => (
            <MewIconButton
              key={vw}
              icon={vw === "grid" ? "grid" : "list"}
              label={vw === "grid" ? t("roster.viewGrid") : t("roster.viewList")}
              active={view === vw}
              aria-label={vw === "grid" ? t("roster.viewGrid") : t("roster.viewList")}
              aria-pressed={view === vw}
              onClick={() => setView(vw)}
              className="mew-browse__view-button"
            />
          ))}
        </div>
      </div>

      {/* category intro */}
      {catDef && (
        <div className="mb-3 text-[0.78125rem]/[1.4] font-medium text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-hand)] line-clamp-2">
          {t(mewCatKey(cat, "desc"))}
        </div>
      )}

      {hasFilterControls && (
        <section className="mew-filter-tray mb-4" aria-label={t("roster.filters")}>
          <div className="mew-filter-tray__bar">
            <MewButton
              icon="filter"
              variant={filtersOpen ? "paper" : "ghost"}
              aria-expanded={filtersOpen}
              aria-controls={filtersId}
              className="mew-filter-tray__toggle"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {t("roster.filters")}
              {activeFilterCount > 0 && <span className="mew-filter-tray__count">{activeFilterCount}</span>}
            </MewButton>
            {activeFilterCount > 0 && (
              <MewButton
                icon="x"
                variant="ghost"
                className="mew-filter-tray__clear"
                onClick={() => setFilters({})}
              >
                {t("roster.clearFilters")}
              </MewButton>
            )}
          </div>
          {filtersOpen && (
            <div id={filtersId} className="mew-filter-tray__body">
              {filterOpts.map((fo) => (
                <MewChips
                  key={fo.key}
                  label={fo.label}
                  value={filters[fo.key] || ""}
                  options={[{ value: "", label: t("roster.filterAll") }, ...fo.options]}
                  onChange={(v) => setFilters((f) => ({ ...f, [fo.key]: v as string }))}
                />
              ))}
              {catFavCount > 0 && (
                <MewChips
                  label={t("roster.filters")}
                  value={filters.__fav || ""}
                  options={[
                    { value: "", label: t("roster.filterAll") },
                    { value: "1", label: t("roster.favoritesLabel", { count: catFavCount }) },
                  ]}
                  onChange={(v) => setFilters((f) => ({ ...f, __fav: v as string }))}
                />
              )}
              {(numberedHidden > 0 || filters.__numbered === "1") && (
                <MewChips
                  label={t("roster.mutationFold")}
                  value={filters.__numbered || ""}
                  options={[
                    { value: "", label: t("roster.mutationNamedOnly") },
                    { value: "1", label: t("roster.mutationShowAll") },
                  ]}
                  onChange={(v) => setFilters((f) => ({ ...f, __numbered: v as string }))}
                />
              )}
            </div>
          )}
        </section>
      )}

      {/* count + shortcut hints */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-[color:var(--mwp-nline)] pb-2.5" aria-live="polite">
        <div className="text-[0.6875rem]/[1.3] tracking-[0.06em] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-disp)]">
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
                ? "mt-4 grid gap-x-3 gap-y-4 [grid-template-columns:repeat(auto-fill,minmax(11.625rem,1fr))] max-[520px]:[grid-template-columns:repeat(auto-fill,minmax(9.375rem,1fr))] [animation:mew-fade-rise_160ms_ease-out]"
                : "mew-reference-list mt-4 grid grid-cols-1 gap-2 [animation:mew-fade-rise_160ms_ease-out]"
            }
            data-density={density}
          >
            {shown.map((r, idx) => (
              <div key={r.id} style={{ "--card-delay": `${Math.min(idx, 11) * 18}ms` } as React.CSSProperties} className="[animation:mew-card-stagger_200ms_ease-out_forwards] [animation-delay:var(--card-delay)]">
                {view === "list" ? (
                  <MewRecordRow
                    cat={cat}
                    rec={r}
                    density={density}
                    favorite={isFav(r)}
                    onOpen={() => {
                      playSound("select")
                      pick(r.id)
                    }}
                  />
                ) : (
                  <CxCard
                    cat={cat}
                    rec={r}
                    onOpen={() => {
                      playSound("select")
                      pick(r.id)
                    }}
                    view={view}
                    cursorEnabled={cursorEnabled}
                    playSound={playSound}
                  />
                )}
              </div>
            ))}
          </div>

          {canLoadMore && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <MewButton
                onClick={loadMore}
                className="mew-button--compact px-6"
              >
                {t("roster.loadMore")}
              </MewButton>
              <p className="text-[0.6875rem]/[1.4] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-hand)]">
                {t("roster.loadMoreHint", { remaining: filtered.length - shown.length })}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
