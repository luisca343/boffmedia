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
    <div className="flex items-center gap-[0.875rem] border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)] px-[0.875rem] py-[0.5625rem] transition-colors hover:bg-panel-2">
      <span className="min-w-0 flex-1 truncate font-body text-[0.8125rem] text-txt" title={filename}>
        {filename}
      </span>
      <span className="w-[6rem] flex-none text-right font-mono text-[0.6875rem] text-txt-dim">{size}</span>
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
        className="cut cut-edge-slant hover:[--cut-line:var(--accent-line)] [--cut-line:var(--line-2)] [--cut:6px] inline-flex flex-none items-center gap-[0.375rem] border border-line-2 bg-panel-2 px-[0.625rem] py-[0.375rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-txt transition-colors hover:border-accent-line hover:text-accent"
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
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-[0.75rem] border-b border-line bg-panel-2 px-[1rem] py-[0.75rem] text-left transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,var(--panel))]">
        <span className="h-[0.5625rem] w-[0.5625rem] flex-none rounded-[2px]" style={{ background: color }} />
        <span className="font-display text-[0.9375rem] font-bold not-italic uppercase tracking-[0.02em]" style={{ color }}>
          {result.consoleLabel}
        </span>
        <span className="ml-auto inline-flex flex-none items-center border border-line-2 bg-base-2 px-[0.5rem] py-[0.25rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-txt-muted">
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
        <span className="h-[0.5625rem] w-[0.5625rem] rounded-[2px] bg-line-2" />
        <span className="h-[0.875rem] w-[7.5rem] animate-[bm-shimmer_1.2s_linear_infinite] bg-[linear-gradient(100deg,var(--panel)_30%,var(--panel-2)_50%,var(--panel)_70%)] bg-[length:220%_100%] motion-reduce:animate-none" />
        <span className="ml-auto h-[1.125rem] w-[3.75rem] animate-[bm-shimmer_1.2s_linear_infinite] bg-[linear-gradient(100deg,var(--panel)_30%,var(--panel-2)_50%,var(--panel)_70%)] bg-[length:220%_100%] motion-reduce:animate-none" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)] px-4 py-[0.6875rem]">
          <span className="h-[0.75rem] flex-1 animate-[bm-shimmer_1.2s_linear_infinite] bg-[linear-gradient(100deg,var(--panel)_30%,var(--panel-2)_50%,var(--panel)_70%)] bg-[length:220%_100%] motion-reduce:animate-none" style={{ maxWidth: `${60 + ((i * 13) % 30)}%` }} />
          <span className="h-[0.75rem] w-[4.375rem] bg-panel-2" />
        </div>
      ))}
    </div>
  )
}
