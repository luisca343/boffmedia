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
      <div className="flex items-center gap-3 px-3 py-2 border-t border-b border-edge bg-[color-mix(in_srgb,var(--layer-2)_30%,transparent)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold px-2 py-[0.2rem] rounded-[var(--radius-pill)] border border-secondary bg-secondary-soft text-secondary-hover">
            <Icon name="shield" size={11} />
            {formatLabel}
          </span>
          {formatNote && (
            <span className="text-[11px] text-ink-dim truncate">{formatNote}</span>
          )}
        </div>
        <span className="flex items-center gap-1 ml-auto font-mono text-[10px] text-ink-dim shrink-0">
          <Icon name="info" size={11} />
          {cutoffLabel} · {month}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-ink-muted">
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
      <span className="ml-auto font-mono text-ink-dim">
        {curTourIsCombined
          ? `Combinado · ${combinedCount ?? 0} torneos`
          : curTourName
            ? `${curTourName}${curTourPlayers ? ` · ${curTourPlayers.toLocaleString("es-ES")} jug.` : ""}`
            : ""}
      </span>
    </div>
  )
}
