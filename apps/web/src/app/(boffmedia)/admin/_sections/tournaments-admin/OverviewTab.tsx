"use client"

import { useTranslations } from "next-intl"
import { Button } from "@boffmedia/ui"
import {
  AvAttention,
  AvKpi,
  AvKpis,
  AvPanel,
  AvPill,
  AvSwitchRow,
  type AvAttentionItem,
} from "../../_components/ui/av-kit"
import type { TournamentDetailApi, TnMatchApi } from "@/services/api/boffmedia/tournamentsService"
import {
  attentionItems,
  fieldStats,
  isPreStart,
  livePhase,
  matchStats,
  registrationIsOpen,
  type AttentionItem,
} from "./lifecycle"
import type { ManageTab } from "./Manage"

export interface OverviewActions {
  toggleRegistration: () => void
  toggleCheckIn: () => void
  resolveField: () => void
  openGenerate: () => void
  publish: () => void
  goTab: (tab: ManageTab) => void
}

/** Where we are, what needs a human, and the three windows an organiser flips. */
export function OverviewTab({
  tn,
  matches,
  actions,
}: {
  tn: TournamentDetailApi
  matches: TnMatchApi[]
  actions: OverviewActions
}) {
  const t = useTranslations("tournaments")
  const ta = useTranslations("tournaments.attention")
  const fs = fieldStats(tn)
  const ms = matchStats(matches)
  const pre = isPreStart(tn)
  const lp = livePhase(tn)
  const phases = tn.phases ?? []
  const regOpen = registrationIsOpen(tn)
  const fieldOpen = tn.teamsheetLockedAt == null

  // Domain items → kit items: wording and the click that starts the fix.
  const cta = (item: AttentionItem): AvAttentionItem["action"] => {
    switch (item.id) {
      case "regInconsistent": return { label: ta("go.openReg"), onClick: actions.toggleRegistration }
      case "draftBracketUnpublished": return { label: ta("go.publish"), onClick: actions.publish }
      case "disputed":
      case "judgeCalls": return { label: ta("go.matches"), onClick: () => actions.goTab("matches") }
      case "missingSteps":
      case "droppedReadmittable": return { label: ta("go.participants"), onClick: () => actions.goTab("participants") }
      case "deadlinePassedUnresolved": return { label: ta("go.resolve"), onClick: actions.resolveField }
      case "startSoonCheckInClosed": return { label: ta("go.openCheckIn"), onClick: actions.toggleCheckIn }
      default: return undefined
    }
  }
  const items: AvAttentionItem[] = attentionItems(tn, matches).map((it) => ({
    id: it.id,
    tone: it.tone,
    text: ta(it.id, { count: it.count ?? 0, hours: it.hours ?? 0 }),
    action: cta(it),
  }))

  return (
    <div>
      <AvKpis>
        <AvKpi label={t("participants")} value={fs.registered} icon="users" />
        {pre && (
          <AvKpi
            label={t("entered")}
            value={`${fs.entered}/${fs.active}`}
            icon="check"
            live={fs.active > 0 && fs.entered === fs.active}
          />
        )}
        <AvKpi
          label={t("checkIn")}
          value={`${fs.checkedIn}/${fs.active}`}
          icon="clock"
          foot={
            <AvPill tone={tn.checkInOpen ? "green" : "muted"}>
              {tn.checkInOpen ? t("regOpen") : t("regClosed")}
            </AvPill>
          }
        />
        {tn.teamsheetRequired && pre && (
          <AvKpi label={t("noTeam")} value={fs.missingTeamsheet} icon="list" />
        )}
        {ms.total > 0 && (
          <AvKpi label={t("matches")} value={`${ms.done}/${ms.total}`} icon="sword" live={tn.status === "live"} />
        )}
        {phases.length > 1 && lp && (
          <AvKpi
            label={t("phase")}
            value={`${lp.order}/${phases.length}`}
            icon="layers"
            foot={<span className="font-mono text-[0.625rem] text-txt-muted">{lp.name}</span>}
          />
        )}
      </AvKpis>

      <div className="grid gap-[1.125rem] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <AvPanel
          title={ta("title")}
          icon="alert"
          flush
          aside={items.length > 0 && (
            <AvPill tone={items.some((i) => i.tone === "error") ? "rose" : "amber"}>{items.length}</AvPill>
          )}
        >
          <AvAttention items={items} empty={ta("clear")} />
        </AvPanel>

        <AvPanel title={t("windows.title")} icon="sliders" flush>
          {pre && (
            <AvSwitchRow
              label={t("registration")}
              on={regOpen}
              reading={regOpen ? t("regOpen") : t("regClosed")}
              action={
                <Button size="sm" onClick={actions.toggleRegistration}>
                  {regOpen ? t("closeReg") : t("openReg")}
                </Button>
              }
            />
          )}
          <AvSwitchRow
            label={t("checkIn")}
            on={tn.checkInOpen}
            reading={tn.checkInOpen ? t("regOpen") : t("regClosed")}
            action={
              <Button size="sm" onClick={actions.toggleCheckIn}>
                {tn.checkInOpen ? t("closeCheckIn") : t("openCheckIn")}
              </Button>
            }
          />
          {pre && (
            <AvSwitchRow
              label={t("fieldLabel")}
              on={fieldOpen}
              reading={fieldOpen ? t("fieldOpen") : t("fieldClosed")}
              hint={t("windows.fieldHint")}
              action={
                // Resolving twice would re-drop anyone re-admitted in between.
                <Button size="sm" disabled={!fieldOpen} onClick={actions.resolveField}>
                  {t("resolveField")}
                </Button>
              }
            />
          )}
        </AvPanel>
      </div>
    </div>
  )
}
