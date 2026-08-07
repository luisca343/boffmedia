import * as React from "react"
import { cn } from "../cn"
import { Badge } from "./badge"
import { Icon } from "./icon"
import { VersionRow } from "./version-row"

export interface ReleaseRowProps {
  published?: boolean
  /** Version id — e.g. "0.0.2". */
  version: React.ReactNode
  /** Status square glyph. Defaults to check (published) / bookmark (draft). */
  statusIcon?: React.ReactNode
  /** Target pill content — e.g. "win-x64". */
  target?: React.ReactNode
  /** Artifact name / size line. */
  meta?: React.ReactNode
  /** Truncated hash text shown on the copy button — e.g. "3af0c1…9e2". */
  hashShort?: React.ReactNode
  /** Full hash, used as the button title. */
  hashFull?: string
  onCopyHash?: () => void
  /** aria-label for the copy button. */
  copyLabel?: string
  date?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

// Launcher-release variant of VersionRow: same sharp data-row frame, plus a
// target pill and a copy-hash button. Replaces the `<table>` in
// launcher-releases-admin.
export function ReleaseRow({
  published,
  version,
  statusIcon,
  target,
  meta,
  hashShort,
  hashFull,
  onCopyHash,
  copyLabel,
  date,
  actions,
  className,
}: ReleaseRowProps) {
  return (
    <VersionRow
      className={className}
      status={published ? "live" : "draft"}
      statusIcon={statusIcon ?? <Icon name={published ? "check" : "bookmark"} size={16} />}
      version={version}
      badges={target != null ? <Badge tone={published ? "ok" : "warn"}>{target}</Badge> : undefined}
      meta={
        <span className="inline-flex items-center gap-3">
          {meta}
          {hashShort != null && (
            <button
              type="button"
              onClick={onCopyHash}
              title={hashFull}
              aria-label={copyLabel}
              className={cn(
                "inline-flex items-center gap-1.5 font-mono text-[10px] text-txt-dim",
                "transition-colors duration-[140ms] hover:text-accent",
              )}
            >
              <Icon name="copy" size={11} />
              {hashShort}
            </button>
          )}
        </span>
      }
      date={date}
      actions={actions}
    />
  )
}
