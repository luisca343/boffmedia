"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"
import type { CatalogSearchConsoleResult, FileDownloadStatus, GameFileEntry } from "../api"
import { CONSOLES } from "../shared/consoles"
// Shared with the sibling catalogue tool — see `src/shared/catalog-chips`.
import { MFR_DOT } from "../shared/catalog-chips"
export { MFR_DOT, MFR_ORDER, ConsoleChip, RegionChip } from "../shared/catalog-chips"

/* ── selectable file row ──────────────────────────────────────────────────── */
export function MyFileRow({
  name, size, selected, downloaded, downloadedLabel, onToggle,
}: {
  name: string
  size: string
  selected: boolean
  downloaded: boolean
  downloadedLabel: string
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className={
        "flex cursor-pointer items-center gap-[0.75rem] border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)] px-[0.875rem] py-[0.5625rem] transition-colors " +
        (selected ? "bg-accent-soft" : downloaded ? "bg-ok-soft" : "hover:bg-panel-2")
      }
    >
      <span
        className={
          "grid h-[0.9375rem] w-[0.9375rem] flex-none place-items-center border transition-colors " +
          (selected ? "border-accent bg-accent text-accent-ink" : "border-line-2 bg-base-2 text-transparent")
        }
        aria-hidden
      >
        <Icon name="check" size={11} />
      </span>
      <span className={"min-w-0 flex-1 truncate font-body text-[0.8125rem] " + (downloaded ? "text-ok" : "text-txt")} title={name}>
        {name}
      </span>
      {downloaded && <Icon name="database" size={13} className="flex-none text-ok" aria-label={downloadedLabel} />}
      <span className="w-[6rem] flex-none text-right font-mono text-[0.6875rem] text-txt-dim">{size}</span>
    </div>
  )
}

/* ── multi-console selectable group (collapsible) ─────────────────────────── */
export function MyConsoleGroup({
  result, groupSelected, downloadedSet, gamesLabel, selectedLabel, selectAllLabel, deselectAllLabel, downloadedLabel,
  onToggle, onToggleAll, defaultOpen = true,
}: {
  result: CatalogSearchConsoleResult
  groupSelected: Set<string>
  downloadedSet: Set<string>
  gamesLabel: (n: number) => string
  selectedLabel: (n: number) => string
  selectAllLabel: (n: number) => string
  deselectAllLabel: string
  downloadedLabel: string
  onToggle: (name: string) => void
  onToggleAll: () => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const mfr = CONSOLES[result.consoleKey]?.manufacturer
  const color = mfr ? MFR_DOT[mfr] : "var(--muted)"
  const localFilename = (file: GameFileEntry) => decodeURIComponent(file.link.split("/").pop() ?? file.name)
  const allSelected = result.files.length > 0 && result.files.every((f) => groupSelected.has(f.name))

  return (
    <div className="overflow-hidden border border-line bg-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-[0.75rem] border-b border-line bg-panel-2 px-[1rem] py-[0.75rem] text-left transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,var(--panel))]"
      >
        <span className="h-[0.5625rem] w-[0.5625rem] flex-none rounded-[2px]" style={{ background: color }} />
        <span className="font-display text-[0.9375rem] font-bold not-italic uppercase tracking-[0.02em]" style={{ color }}>
          {result.consoleLabel}
        </span>
        <span className="ml-auto inline-flex flex-none items-center border border-line-2 bg-base-2 px-[0.5rem] py-[0.25rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-txt-muted">
          {gamesLabel(result.count)}
        </span>
        {groupSelected.size > 0 && (
          <span className="inline-flex flex-none items-center border border-accent-line bg-accent-soft px-[0.5rem] py-[0.25rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-accent">
            {selectedLabel(groupSelected.size)}
          </span>
        )}
        <Icon name={open ? "chevronDown" : "chevronRight"} size={16} className="flex-none text-txt-dim" />
      </button>
      {open && (
        <div>
          <div className="flex items-center gap-[0.625rem] border-b border-line bg-[color-mix(in_srgb,var(--panel-2)_50%,var(--panel))] px-[0.875rem] py-[0.5rem]">
            <button
              type="button"
              onClick={onToggleAll}
              className="inline-flex items-center gap-[0.375rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-txt-muted transition-colors hover:text-txt"
            >
              <Icon name={allSelected ? "x" : "check"} size={12} />
              {allSelected ? deselectAllLabel : selectAllLabel(result.files.length)}
            </button>
          </div>
          {result.files.map((f) => (
            <MyFileRow
              key={f.name}
              name={f.name}
              size={f.size}
              selected={groupSelected.has(f.name)}
              downloaded={downloadedSet.has(localFilename(f))}
              downloadedLabel={downloadedLabel}
              onToggle={() => onToggle(f.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── per-file download status ─────────────────────────────────────────────── */
const STATUS: Record<FileDownloadStatus, { icon: Parameters<typeof Icon>[0]["name"]; cls: string; spin?: boolean }> = {
  pending: { icon: "clock", cls: "text-txt-dim" },
  downloading: { icon: "refresh", cls: "text-signal", spin: true },
  downloaded: { icon: "check", cls: "text-ok" },
  skipped: { icon: "swap", cls: "text-warn" },
  failed: { icon: "x", cls: "text-bad" },
}

export function MyStatusIcon({ status }: { status: FileDownloadStatus }) {
  const s = STATUS[status]
  return <Icon name={s.icon} size={14} className={s.cls + " flex-none" + (s.spin ? " animate-spin motion-reduce:animate-none" : "")} />
}
