import * as React from "react"
import { cn } from "../cn"

export type RowStatus = "live" | "draft" | "neutral"

export interface VersionRowProps {
  /** Drives the left-bar colour + the status-square tint. */
  status?: RowStatus
  /** Glyph inside the 34px status square — e.g. `<Icon name="check"/>`. */
  statusIcon?: React.ReactNode
  /** The version id / name — mono, bold. */
  version: React.ReactNode
  /** Inline pills next to the version — Publicada / Última / Borrador. */
  badges?: React.ReactNode
  /** Mono meta line — `loader · N archivos`. */
  meta?: React.ReactNode
  /** Pushed to the right, before the actions. */
  date?: React.ReactNode
  /** Buttons grouped at the end (Clonar; drafts add Editar/Borrar/Publicar). */
  actions?: React.ReactNode
  className?: string
}

const BAR: Record<RowStatus, string> = {
  live: "border-l-ok",
  draft: "border-l-warn",
  neutral: "border-l-line-2",
}

// Dense data row for a pack version. Sharp box, status left-bar, everything on one
// line: status square → version + badges → meta → date (ml-auto) → actions. Replaces
// the `.cut` `<article>` in packs-admin's VersionsTab and fixes the floating-CLONAR
// problem by grouping the buttons at the row end.
export function VersionRow({
  status = "neutral",
  statusIcon,
  version,
  badges,
  meta,
  date,
  actions,
  className,
}: VersionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-[0.875rem] border border-solid border-line border-l-[3px] bg-panel px-[0.875rem] py-[0.6875rem]",
        "transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:bg-panel-2",
        BAR[status],
        className,
      )}
    >
      {statusIcon != null && (
        <span
          className={cn(
            "grid size-[2.125rem] shrink-0 place-items-center border border-solid",
            status === "live"
              ? "border-accent-line bg-accent-soft text-accent"
              : "border-line-2 bg-panel-2 text-txt-muted",
          )}
        >
          {statusIcon}
        </span>
      )}

      <div className="flex min-w-0 items-baseline gap-2.5">
        <span className="font-mono text-[0.9375rem] font-bold tracking-[0.02em] text-txt">{version}</span>
        {badges != null && <span className="flex items-center gap-1.5">{badges}</span>}
      </div>

      {meta != null && (
        <span className="hidden whitespace-nowrap font-mono text-[0.6875rem] text-txt-dim sm:inline">{meta}</span>
      )}

      {date != null && (
        <span className="ml-auto whitespace-nowrap font-mono text-[0.6875rem] text-txt-dim">{date}</span>
      )}

      {actions != null && (
        <span className={cn("flex shrink-0 items-center gap-1", date == null && "ml-auto")}>{actions}</span>
      )}
    </div>
  )
}
