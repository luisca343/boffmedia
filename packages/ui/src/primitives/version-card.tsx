import * as React from "react"
import { cn } from "../cn"
import type { RowStatus } from "./version-row"

export interface VersionCardProps {
  status?: RowStatus
  /** Glyph inside the status square. */
  statusIcon?: React.ReactNode
  version: React.ReactNode
  /** Inline pills next to the version. */
  badges?: React.ReactNode
  /** Mono meta chips — minecraft · loader · N archivos. */
  meta?: React.ReactNode
  /** Release notes / changelog. */
  notes?: React.ReactNode
  /** Footer left — the date. */
  date?: React.ReactNode
  /** Footer right — action buttons. */
  actions?: React.ReactNode
  className?: string
}

const BAR: Record<RowStatus, string> = {
  live: "border-l-ok",
  draft: "border-l-warn",
  neutral: "border-l-line-2",
}

// Structured card variant of VersionRow (Option B): a header block (status square,
// version, badges, meta, notes) over a tinted footer with the date left and the
// actions right. Use when the notes matter enough to give them room.
export function VersionCard({
  status = "neutral",
  statusIcon,
  version,
  badges,
  meta,
  notes,
  date,
  actions,
  className,
}: VersionCardProps) {
  return (
    <div
      className={cn(
        "border border-solid border-line border-l-[3px] bg-panel",
        BAR[status],
        className,
      )}
    >
      <div className="flex items-start gap-3 px-[15px] py-[13px]">
        {statusIcon != null && (
          <span
            className={cn(
              "grid size-[34px] shrink-0 place-items-center border border-solid",
              status === "live"
                ? "border-accent-line bg-accent-soft text-accent"
                : "border-line-2 bg-panel-2 text-txt-muted",
            )}
          >
            {statusIcon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[16px] font-bold text-txt">{version}</span>
            {badges}
          </div>
          {meta != null && (
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-txt-dim">{meta}</div>
          )}
          {notes != null && (
            <p className="mt-2 text-[12.5px] leading-[1.4] text-txt-muted">{notes}</p>
          )}
        </div>
      </div>

      {(date != null || actions != null) && (
        <div className="flex items-center gap-2 border-t border-solid border-line bg-panel-2 px-[15px] py-2.5">
          {date != null && <span className="font-mono text-[10.5px] text-txt-dim">{date}</span>}
          {actions != null && <span className="ml-auto flex items-center gap-1">{actions}</span>}
        </div>
      )}
    </div>
  )
}
