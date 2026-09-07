"use client"

import { useVgcT } from "../../i18n";
import { DkSub, DkSubNote, DkSeg } from "@boffmedia/ui/datakit"
import { fmtCount } from "../_lib/meta-types"

interface VgcSubbarProps {
  view: string
  curTourName?: string
  curTourPlayers?: number
  curTourIsCombined?: boolean
  combinedCount?: number
  onViewChange: (view: string) => void
}

export function VgcSubbar({
  view,
  curTourName,
  curTourPlayers,
  curTourIsCombined,
  combinedCount,
  onViewChange,
}: VgcSubbarProps) {
  const t = useVgcT("meta")

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
