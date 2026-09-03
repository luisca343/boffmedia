"use client"

import * as React from "react"
import { Button, Icon, Input, Disclosure, Banner, Empty, StatChip, ToolHeader } from "@boffmedia/ui"
import { useToolT, BIBLIOTECA_NS } from "../i18n"
import { CONSOLES, type Manufacturer } from "../shared/consoles"
import { useBiblioteca, COMMON_REGIONS } from "./useBiblioteca"
import { ConsoleChip, RegionChip, ConsoleGroup, SkeletonGroup, MFR_DOT, MFR_ORDER } from "./ct-kit"

const CONSOLE_GROUPS = MFR_ORDER.map((mfr) => ({
  mfr,
  entries: Object.entries(CONSOLES).filter(([, v]) => v.manufacturer === mfr),
}))

export function BibliotecaView() {
  const t = useToolT(BIBLIOTECA_NS)
  const {
    selectedConsole, regions, query, loading, results, error,
    setQuery, toggleRegion, addRegion, removeRegion, selectConsole, search,
  } = useBiblioteca()

  const [custom, setCustom] = React.useState("")
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    search()
  }
  const addCustom = () => {
    addRegion(custom)
    setCustom("")
  }

  const filesLabel = (n: number) => t("filesN", { n })
  const errorMsg = error === "loadError" || error === "searchError" ? t(error) : error

  return (
    <main className="pb-[0.625rem]">
      <ToolHeader
        className="mb-5"
        title={<>{t("titlePre")} <em>{t("titleEm")}</em></>}
        sub={t("sub")}
        meta={
          results && (
            <>
              <StatChip variant="tile" value={results.totalCount} label={t("kpiFiles")} />
              {!selectedConsole && <StatChip variant="tile" value={results.consoles.length} label={t("kpiConsoles")} />}
            </>
          )
        }
      />

      {/* ── control bar: search ────────────────────────────────────────────── */}
      <form onSubmit={onSubmit} className="mb-[0.875rem] flex flex-wrap items-center gap-[0.75rem]">
        <div className="relative min-w-[13.75rem] max-w-[26.25rem] flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute left-[0.8125rem] top-1/2 -translate-y-1/2 text-txt-dim" />
          <Input className="pl-10" placeholder={t("searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button variant="pri" type="submit" icon={loading ? "refresh" : "search"} loading={loading}>
          {t("searchBtn")}
        </Button>
      </form>

      {/* ── console filter ─────────────────────────────────────────────────── */}
      <div className="mb-[0.875rem] flex flex-col gap-[0.625rem]">
        <div className="flex items-center gap-[0.5rem]">
          <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-txt-dim">{t("consoleLabel")}</span>
          {selectedConsole ? (
            <span className="cut cut-edge-slant [--cut-line:var(--accent-line)] [--cut:4px] inline-flex items-center border border-accent-line bg-accent-soft px-[0.5rem] py-[0.25rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-accent">
              {CONSOLES[selectedConsole]?.shortLabel ?? selectedConsole}
            </span>
          ) : (
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.06em] text-txt-dim">{t("allPlatforms")}</span>
          )}
        </div>
        <div className="flex flex-col gap-[0.5rem]">
          {CONSOLE_GROUPS.map(({ mfr, entries }) => (
            <div key={mfr} className="flex items-start gap-[0.625rem]">
              <span className="mt-[0.5rem] w-[4rem] flex-none text-right font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em]" style={{ color: MFR_DOT[mfr as Manufacturer] }}>
                {mfr}
              </span>
              <div className="flex flex-wrap gap-[0.375rem]">
                {entries.map(([key, info]) => (
                  <ConsoleChip
                    key={key}
                    label={info.shortLabel}
                    dot={MFR_DOT[mfr as Manufacturer]}
                    on={selectedConsole === key}
                    onClick={() => selectConsole(key)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── region filter ──────────────────────────────────────────────────── */}
      <div className="mb-[1.25rem]">
        <Disclosure title={t("regionLabel")} icon="filter" sub={regions.length ? regions.join(" · ") : t("regionOptional")}>
          <div className="flex flex-col gap-[0.75rem]">
            <div className="flex flex-wrap gap-[0.375rem]">
              {COMMON_REGIONS.map((r) => (
                <RegionChip key={r} label={r} on={regions.includes(r)} onClick={() => toggleRegion(r)} />
              ))}
            </div>
            <div className="flex gap-[0.5rem]">
              <Input
                className="max-w-[16.25rem]"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustom()
                  }
                }}
                placeholder={t("regionCustomPlaceholder")}
              />
              <Button size="sm" icon="plus" onClick={addCustom} disabled={!custom.trim()}>
                {t("addRegion")}
              </Button>
            </div>
            {regions.length > 0 && (
              <div className="flex flex-wrap items-center gap-[0.375rem]">
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">{t("activeRegions")}</span>
                {regions.map((r) => (
                  <span key={r} className="cut cut-edge-slant [--cut-line:var(--accent-line)] [--cut:4px] inline-flex items-center gap-[0.375rem] border border-accent-line bg-accent-soft py-[0.25rem] pl-[0.5rem] pr-[0.3125rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-accent">
                    {r}
                    <button type="button" aria-label={t("removeRegion", { r })} onClick={() => removeRegion(r)} className="grid h-[1rem] w-[1rem] place-items-center text-accent/70 transition-opacity hover:text-accent">
                      <Icon name="x" size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Disclosure>
      </div>

      {/* ── results ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-[1rem]">
          <Banner tone="error" title={t("errorTitle")}>
            {errorMsg}
          </Banner>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-[0.75rem]">
          <SkeletonGroup />
          <SkeletonGroup />
        </div>
      ) : results ? (
        <div className="flex flex-col gap-[0.75rem]">
          <div className="flex flex-wrap items-center justify-between gap-[0.625rem]">
            <p className="font-body text-[0.875rem] text-txt">
              {results.query ? (
                <>
                  {t("resultsFor", { q: results.query })?.split(`${results.query}`).map((part: string, i: number, arr: string[]) =>
                    i < arr.length - 1
                      ? [part, <span key={`q-${i}`} className="font-semibold text-accent">{results.query}</span>]
                      : part
                  ).flat()}
                </>
              ) : (
                t("allGames")
              )}
              {selectedConsole && <span className="text-txt-muted"> · {CONSOLES[selectedConsole]?.label}</span>}
            </p>
            <div className="flex items-center gap-[0.625rem] font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-txt-muted">
              <span className="inline-flex items-center gap-[0.375rem] text-ok">
                <Icon name="database" size={13} />
                {t("filesN", { n: results.totalCount })}
              </span>
              {!selectedConsole && (
                <>
                  <span className="text-txt-dim">·</span>
                  <span>{t("consolesN", { n: results.consoles.length })}</span>
                </>
              )}
            </div>
          </div>

          {results.totalCount === 0 ? (
            <Empty icon="database" title={t("emptyTitle")} lead={results.query ? t("emptySearch", { q: results.query }) : t("emptyLead")} />
          ) : (
            <div className="flex flex-col gap-[0.75rem]">
              {results.consoles.map((c) => (
                <ConsoleGroup key={c.consoleKey} result={c} filesLabel={filesLabel} downloadLabel={t("download")} defaultOpen={results.consoles.length <= 4} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Empty icon="database" title={t("idleTitle")} lead={t("idleLead")} />
      )}
    </main>
  )
}
