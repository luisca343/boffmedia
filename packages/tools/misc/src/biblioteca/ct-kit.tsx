"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"
import { openUrl } from "@boffmedia/tool-kit"
import type { SearchConsoleResult } from "../api"
import { serveFileUrl } from "../api"
import { CONSOLES } from "../shared/consoles"
// Shared with the sibling catalogue tool — see `src/shared/catalog-chips`.
import { MFR_DOT } from "../shared/catalog-chips"
export { MFR_DOT, MFR_ORDER, ConsoleChip, RegionChip } from "../shared/catalog-chips"

/* ── file row ─────────────────────────────────────────────────────────────── */
function FileRow({ consoleKey, filename, size, downloadLabel }: { consoleKey: string; filename: string; size: string; downloadLabel: string }) {
  return (
    <div className="flex items-center gap-[14px] border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)] px-[14px] py-[9px] transition-colors hover:bg-panel-2">
      <span className="min-w-0 flex-1 truncate font-body text-[13px] text-txt" title={filename}>
        {filename}
      </span>
      <span className="w-[96px] flex-none text-right font-mono text-[11px] text-txt-dim">{size}</span>
      {/* A button, not an anchor: the launcher's page sits on `tauri://localhost`,
          where there is no browser download to trigger. `openUrl` hands the url
          to the host instead — the browser's own download on the web, the system
          browser in the launcher — and the endpoint's
          `Content-Disposition: attachment` does the rest. Nothing is lost: the
          `download` attribute this replaces was already being ignored, because
          the API is a different origin. */}
      <button
        type="button"
        onClick={() => openUrl(serveFileUrl(consoleKey, filename))}
        className="cut cut-edge-slant hover:[--cut-line:var(--accent-line)] [--cut-line:var(--line-2)] [--cut:6px] inline-flex flex-none items-center gap-[6px] border border-line-2 bg-panel-2 px-[10px] py-[6px] font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-txt transition-colors hover:border-accent-line hover:text-accent"
      >
        <Icon name="download" size={13} />
        {downloadLabel}
      </button>
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
