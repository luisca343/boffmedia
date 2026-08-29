"use client"

import { useTranslations } from "next-intl"
import { Button } from "@boffmedia/ui"
import { AvAlert, AvPanel } from "../../_components/ui/av-kit"
import { TorneoView } from "../../../torneos/_components/TorneoView"
import type { TournamentDetailApi, TnMatchApi } from "@/services/api/boffmedia/tournamentsService"
import { livePhase } from "./lifecycle"
import { ReportPanel } from "./ReportPanel"

/** Results in, disputes out, and the bracket as players see it. */
export function MatchesTab({
  tn,
  matches,
  onChanged,
  openGenerate,
}: {
  tn: TournamentDetailApi
  matches: TnMatchApi[]
  onChanged: () => void
  openGenerate: () => void
}) {
  const t = useTranslations("tournaments")

  if (matches.length === 0) {
    return (
      <AvAlert tone="info" title={t("matchesEmptyTitle")}>
        <p className="m-0 mb-3">{t("matchesEmpty")}</p>
        <Button size="sm" variant="pri" icon="bolt" onClick={openGenerate}>{t("generate")}</Button>
      </AvAlert>
    )
  }

  const lp = livePhase(tn)
  return (
    <div>
      <ReportPanel
        tid={tn.id}
        slug={tn.slug}
        bestOf={lp?.bestOf ?? tn.bestOf}
        matches={matches}
        onReported={onChanged}
      />
      <AvPanel title={t("bracketTitle")} icon="trophy">
        <TorneoView detail={tn} />
      </AvPanel>
    </div>
  )
}
