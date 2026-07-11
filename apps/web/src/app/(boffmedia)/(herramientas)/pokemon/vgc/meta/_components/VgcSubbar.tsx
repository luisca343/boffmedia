"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@/components/boffmedia/primitives"
import { DkSub, DkSubNote, DkSeg, DkChip } from "@/components/boffmedia/ui/tools/datakit"
import { fmtCount } from "../_lib/meta-types"

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
      <DkSub>
        <DkChip icon="shield" tone="var(--accent-bright)">{formatLabel}</DkChip>
        {formatNote && <span className="min-w-0 truncate font-mono text-[11px] leading-[1.4] text-txt-muted">{formatNote}</span>}
        <DkSubNote>
          <Icon name="info" size={12} />
          {cutoffLabel}
          {month ? ` · ${month}` : ""}
        </DkSubNote>
      </DkSub>
    )
  }

  return (
    <DkSub>
      <DkSeg
        size="sm"
        value={view}
        ariaLabel={t("aria.tournamentView")}
        onChange={onViewChange}
        options={[
          { value: "aggregate", label: t("tabs.aggregate") },
          { value: "players", label: t("tabs.players") },
          { value: "divergence", label: t("tabs.divergence") },
        ]}
      />
      <DkSubNote>
        {curTourIsCombined
          ? t("sub.combined", { count: combinedCount ?? 0 })
          : curTourName
            ? curTourPlayers
              ? t("sub.tourWithPlayers", { name: curTourName, count: fmtCount(curTourPlayers) })
              : curTourName
            : ""}
      </DkSubNote>
    </DkSub>
  )
}
