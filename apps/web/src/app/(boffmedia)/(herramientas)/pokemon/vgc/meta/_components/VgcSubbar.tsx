"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { SegTabs } from "@/components/boffmedia/primitives/seg-tabs"

interface VgcSubbarProps {
  tab: string
  view: string
  formatLabel?: string
  formatNote?: string
  cutoffLabel?: string
  month?: string
  curTourName?: string
  curTourPlayers?: number
  curTourIsCombined?: boolean
  combinedCount?: number
  onViewChange: (view: string) => void
}

export function VgcSubbar({
  tab,
  view,
  formatLabel,
  formatNote,
  cutoffLabel,
  month,
  curTourName,
  curTourPlayers,
  curTourIsCombined,
  combinedCount,
  onViewChange,
}: VgcSubbarProps) {
  const t = useTranslations("vgc.meta")

  if (tab === "stats") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)]">
        <span className="inline-flex font-mono text-[10px] px-1.5 py-[0.15rem] rounded-[var(--radius-pill)] border border-[var(--border)] text-[var(--text-dim)]">
          {formatLabel}
        </span>
        {formatNote && <span className="text-xs">{formatNote}</span>}
        <span className="flex items-center gap-1 ml-auto font-mono text-[var(--text-dim)]">
          <Icon name="info" size={12} />
          {cutoffLabel} · {month}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)]">
      <SegTabs
        value={view}
        size="sm"
        options={[
          { value: "aggregate", label: t("tabs.aggregate") },
          { value: "players", label: t("tabs.players") },
          { value: "divergence", label: t("tabs.divergence") },
        ]}
        onChange={onViewChange}
      />
      <span className="ml-auto font-mono text-[var(--text-dim)]">
        {curTourIsCombined
          ? `Combinado · ${combinedCount ?? 0} torneos`
          : curTourName
            ? `${curTourName}${curTourPlayers ? ` · ${curTourPlayers.toLocaleString("es-ES")} jug.` : ""}`
            : ""}
      </span>
    </div>
  )
}
