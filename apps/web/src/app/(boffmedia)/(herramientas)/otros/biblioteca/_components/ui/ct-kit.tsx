"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"
import { ScrapeService, type SearchConsoleResult } from "@/services/api/boffmedia/scrapeService"
import { CONSOLES, type Manufacturer } from "../../../_components/consoles"

// Manufacturer accent dots (hue per platform family) — legible on graphite.
export const MFR_DOT: Record<Manufacturer, string> = {
  Nintendo: "#ff5b6a",
  Sony: "#4da3ff",
  Microsoft: "#34d377",
  Sega: "#f0803c",
  Retro: "#9d7bff",
  Arcade: "#ffb224",
}
export const MFR_ORDER: Manufacturer[] = ["Nintendo", "Sony", "Microsoft", "Sega", "Retro", "Arcade"]

/* ── console filter chip (ct-pchip) ───────────────────────────────────────── */
export function CtChip({ label, dot, on, onClick }: { label: string; dot: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={on ? ({ "--ph": dot, borderColor: dot, background: `color-mix(in oklch, ${dot} 12%, transparent)` } as React.CSSProperties) : ({ "--ph": dot } as React.CSSProperties)}
      className={
        "inline-flex items-center gap-[6px] border px-[11px] py-[7px] font-body text-[11px] font-semibold tracking-[0.02em] transition-colors " +
        (on ? "text-txt" : "border-line bg-panel text-txt-muted hover:border-line-2 hover:text-txt")
      }
    >
      <span className="h-[9px] w-[9px] flex-none rounded-[2px]" style={{ background: dot }} />
      {label}
    </button>
  )
}

/* ── region toggle chip ───────────────────────────────────────────────────── */
export function RegionChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "cut cut-edge-slant [--cut:4px] border px-[11px] py-[6px] font-mono text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors " +
        (on
          ? "border-accent [--cut-line:var(--accent)] bg-accent-soft text-accent"
          : "border-line [--cut-line:var(--line)] bg-panel text-txt-muted hover:border-line-2 hover:[--cut-line:var(--line-2)] hover:text-txt")
      }
    >
      {label}
    </button>
  )
}

/* ── KPI tile (ct-kpi) ────────────────────────────────────────────────────── */
export function Kpi({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-[3px] border border-line border-t-[3px] border-t-accent bg-panel px-[16px] py-[12px]">
      <b className="font-display text-[26px] font-extrabold italic leading-none text-txt">{value}</b>
      <small className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">{label}</small>
    </div>
  )
}

/* ── file row ─────────────────────────────────────────────────────────────── */
function FileRow({ consoleKey, filename, size, downloadLabel }: { consoleKey: string; filename: string; size: string; downloadLabel: string }) {
  return (
    <div className="flex items-center gap-[14px] border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)] px-[14px] py-[9px] transition-colors hover:bg-panel-2">
      <span className="min-w-0 flex-1 truncate font-body text-[13px] text-txt" title={filename}>
        {filename}
      </span>
      <span className="w-[96px] flex-none text-right font-mono text-[11px] text-txt-dim">{size}</span>
      <a
        href={ScrapeService.getServeFileUrl(consoleKey, filename)}
        download={filename}
        className="cut cut-edge-slant hover:[--cut-line:var(--accent-line)] [--cut-line:var(--line-2)] [--cut:6px] inline-flex flex-none items-center gap-[6px] border border-line-2 bg-panel-2 px-[10px] py-[6px] font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-txt transition-colors hover:border-accent-line hover:text-accent"
      >
        <Icon name="download" size={13} />
        {downloadLabel}
      </a>
    </div>
  )
}

/* ── console result group (collapsible) ───────────────────────────────────── */
export function ConsoleGroup({ result, filesLabel, downloadLabel, defaultOpen = true }: { result: SearchConsoleResult; filesLabel: (n: number) => string; downloadLabel: string; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const mfr = CONSOLES[result.consoleKey]?.manufacturer
  const color = mfr ? MFR_DOT[mfr] : "var(--muted)"
  return (
    <div className="overflow-hidden border border-line bg-panel">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-[12px] border-b border-line bg-panel-2 px-[16px] py-[12px] text-left transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,var(--panel))]">
        <span className="h-[9px] w-[9px] flex-none rounded-[2px]" style={{ background: color }} />
        <span className="font-display text-[15px] font-bold not-italic uppercase tracking-[0.02em]" style={{ color }}>
          {result.consoleLabel}
        </span>
        <span className="ml-auto inline-flex flex-none items-center border border-line-2 bg-base-2 px-[8px] py-[4px] font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-txt-muted">
          {filesLabel(result.count)}
        </span>
        <Icon name={open ? "chevronDown" : "chevronRight"} size={16} className="flex-none text-txt-dim" />
      </button>
      {open && (
        <div>
          {result.files.map((f) => (
            <FileRow key={f.filename} consoleKey={result.consoleKey} filename={f.filename} size={f.size} downloadLabel={downloadLabel} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── skeleton row (ct-sk) ─────────────────────────────────────────────────── */
export function SkeletonGroup() {
  return (
    <div className="border border-line bg-panel">
      <div className="flex items-center gap-3 border-b border-line bg-panel-2 px-4 py-3">
        <span className="h-[9px] w-[9px] rounded-[2px] bg-line-2" />
        <span className="h-[14px] w-[120px] animate-[bm-shimmer_1.2s_linear_infinite] bg-[linear-gradient(100deg,var(--panel)_30%,var(--panel-2)_50%,var(--panel)_70%)] bg-[length:220%_100%] motion-reduce:animate-none" />
        <span className="ml-auto h-[18px] w-[60px] animate-[bm-shimmer_1.2s_linear_infinite] bg-[linear-gradient(100deg,var(--panel)_30%,var(--panel-2)_50%,var(--panel)_70%)] bg-[length:220%_100%] motion-reduce:animate-none" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)] px-4 py-[11px]">
          <span className="h-[12px] flex-1 animate-[bm-shimmer_1.2s_linear_infinite] bg-[linear-gradient(100deg,var(--panel)_30%,var(--panel-2)_50%,var(--panel)_70%)] bg-[length:220%_100%] motion-reduce:animate-none" style={{ maxWidth: `${60 + ((i * 13) % 30)}%` }} />
          <span className="h-[12px] w-[70px] bg-panel-2" />
        </div>
      ))}
    </div>
  )
}
