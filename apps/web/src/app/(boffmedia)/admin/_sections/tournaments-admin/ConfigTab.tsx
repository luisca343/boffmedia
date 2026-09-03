"use client"

import { useTranslations } from "next-intl"
import { Button } from "@boffmedia/ui"
import { AvPanel } from "../../_components/ui/av-kit"
import type { TournamentDetailApi } from "@/services/api/boffmedia/tournamentsService"
import { EditPanel } from "./EditPanel"
import { PhasesManager } from "./PhasesEditor"

/**
 * Everything that describes the tournament rather than operates it: the
 * settings form in fieldsets, the phase plan, and — last, behind a rule — the
 * two things that end it.
 */
export function ConfigTab({
  tn,
  onChange,
  onCancelTournament,
  onDelete,
}: {
  tn: TournamentDetailApi
  onChange: () => void
  onCancelTournament: () => void
  onDelete: () => void
}) {
  const t = useTranslations("tournaments")
  const canCancel = tn.status !== "completed" && tn.status !== "cancelled"

  return (
    <div>
      <EditPanel detail={tn} onChange={onChange} />
      <PhasesManager detail={tn} onChange={onChange} />

      <AvPanel title={t("stageDanger")} icon="alert" className="border-bad/40">
        <div className="grid gap-3 sm:grid-cols-2">
          {canCancel && (
            <DangerRow
              title={t("cancelTournament")}
              hint={t("dangerCancelHint")}
              action={<Button size="sm" variant="danger" icon="x" onClick={onCancelTournament}>{t("cancelTournament")}</Button>}
            />
          )}
          <DangerRow
            title={t("delete")}
            hint={t("dangerDeleteHint")}
            action={<Button size="sm" variant="danger" icon="trash" onClick={onDelete}>{t("delete")}</Button>}
          />
        </div>
      </AvPanel>
    </div>
  )
}

function DangerRow({ title, hint, action }: { title: string; hint: string; action: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border border-solid border-line bg-base p-3">
      <div className="min-w-0">
        <p className="m-0 font-body text-[0.8125rem] font-semibold text-txt">{title}</p>
        <p className="m-0 mt-0.5 font-body text-[0.75rem] leading-[1.45] text-txt-muted">{hint}</p>
      </div>
      {action}
    </div>
  )
}
