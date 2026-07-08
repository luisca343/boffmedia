"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Kicker, Button, Icon, Input, Disclosure, Banner, Empty } from "@/components/boffmedia/primitives"
import { CONSOLES, type Manufacturer } from "../../_components/consoles"
import { useBiblioteca, COMMON_REGIONS } from "../_lib/useBiblioteca"
import { CtChip, RegionChip, Kpi, ConsoleGroup, SkeletonGroup, MFR_DOT, MFR_ORDER } from "./ui/ct-kit"

const CONSOLE_GROUPS = MFR_ORDER.map((mfr) => ({
  mfr,
  entries: Object.entries(CONSOLES).filter(([, v]) => v.manufacturer === mfr),
}))

export function BibliotecaView() {
  const t = useTranslations("otros.bibliotecaApp")
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
    <main data-ds="boffmedia" className="pb-[10px]">
      {/* ── header ─────────────────────────────────────────────────────────── */}
      <header className="mb-[20px] mt-[4px] flex flex-wrap items-end justify-between gap-[26px]">
        <div className="max-w-[60ch]">
          <Kicker>{t("kicker")}</Kicker>
          <h1 className="my-[10px] text-[clamp(34px,4.4vw,54px)] leading-[0.94]">
            {t("titlePre")} <em>{t("titleEm")}</em>
          </h1>
          <p className="max-w-[58ch] text-[15px] leading-[1.5] text-txt-muted">{t("sub")}</p>
        </div>
        {results && (
          <div className="flex flex-none gap-[10px]">
            <Kpi value={results.totalCount} label={t("kpiFiles")} />
            {!selectedConsole && <Kpi value={results.consoles.length} label={t("kpiConsoles")} />}
          </div>
        )}
      </header>

      {/* ── control bar: search ────────────────────────────────────────────── */}
      <form onSubmit={onSubmit} className="mb-[14px] flex flex-wrap items-center gap-[12px]">
        <div className="relative min-w-[220px] max-w-[420px] flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-txt-dim" />
          <Input className="pl-10" placeholder={t("searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button variant="pri" type="submit" icon={loading ? "refresh" : "search"} loading={loading}>
          {t("searchBtn")}
        </Button>
      </form>

      {/* ── console filter ─────────────────────────────────────────────────── */}
      <div className="mb-[14px] flex flex-col gap-[10px]">
        <div className="flex items-center gap-[8px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-txt-dim">{t("consoleLabel")}</span>
          {selectedConsole ? (
            <span className="cut [--cut:4px] inline-flex items-center border border-accent-line bg-accent-soft px-[8px] py-[4px] font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-accent">
              {CONSOLES[selectedConsole]?.shortLabel ?? selectedConsole}
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-txt-dim">{t("allPlatforms")}</span>
          )}
        </div>
        <div className="flex flex-col gap-[8px]">
          {CONSOLE_GROUPS.map(({ mfr, entries }) => (
            <div key={mfr} className="flex items-start gap-[10px]">
              <span className="mt-[8px] w-[64px] flex-none text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: MFR_DOT[mfr as Manufacturer] }}>
                {mfr}
              </span>
              <div className="flex flex-wrap gap-[6px]">
                {entries.map(([key, info]) => (
                  <CtChip
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
      <div className="mb-[20px]">
        <Disclosure title={t("regionLabel")} icon="filter" sub={regions.length ? regions.join(" · ") : t("regionOptional")}>
          <div className="flex flex-col gap-[12px]">
            <div className="flex flex-wrap gap-[6px]">
              {COMMON_REGIONS.map((r) => (
                <RegionChip key={r} label={r} on={regions.includes(r)} onClick={() => toggleRegion(r)} />
              ))}
            </div>
            <div className="flex gap-[8px]">
              <Input
                className="max-w-[260px]"
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
              <div className="flex flex-wrap items-center gap-[6px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">{t("activeRegions")}</span>
                {regions.map((r) => (
                  <span key={r} className="cut [--cut:4px] inline-flex items-center gap-[6px] border border-accent-line bg-accent-soft py-[4px] pl-[8px] pr-[5px] font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-accent">
                    {r}
                    <button type="button" aria-label={`Quitar ${r}`} onClick={() => removeRegion(r)} className="grid h-[16px] w-[16px] place-items-center text-accent/70 transition-opacity hover:text-accent">
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
        <div className="mb-[16px]">
          <Banner tone="error" title={t("errorTitle")}>
            {errorMsg}
          </Banner>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-[12px]">
          <SkeletonGroup />
          <SkeletonGroup />
        </div>
      ) : results ? (
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-wrap items-center justify-between gap-[10px]">
            <p className="font-body text-[14px] text-txt">
              {results.query ? t.rich("resultsFor", { q: results.query, b: (c) => <span className="font-semibold text-accent">{c}</span> }) : t("allGames")}
              {selectedConsole && <span className="text-txt-muted"> · {CONSOLES[selectedConsole]?.label}</span>}
            </p>
            <div className="flex items-center gap-[10px] font-mono text-[11px] uppercase tracking-[0.06em] text-txt-muted">
              <span className="inline-flex items-center gap-[6px] text-ok">
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
            <div className="flex flex-col gap-[12px]">
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
