"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, ConfirmDialog, Spinner, Stepper, Tabs, toast } from "@boffmedia/ui"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { AvPill, AvSectionHead, AvViewLink } from "../../_components/ui/av-kit"
import { useTournament } from "@/hooks/tournaments/useTournament"
import {
  TournamentsService,
  type TnMatchApi,
  type TnStatus,
} from "@/services/api/boffmedia/tournamentsService"
import { STAGES, fieldStats, matchStats, nextAction, registrationIsOpen, stageIndex } from "./lifecycle"
import { GenerateDialog } from "./GenerateDialog"
import { OverviewTab, type OverviewActions } from "./OverviewTab"
import { ConfigTab } from "./ConfigTab"
import { EntrantsPanel } from "./EntrantsPanel"
import { MatchesTab } from "./MatchesTab"

export type ManageTab = "overview" | "config" | "participants" | "matches"
export const MANAGE_TABS: ManageTab[] = ["overview", "config", "participants", "matches"]

const STATUS_TONE: Record<TnStatus, "default" | "green" | "accent" | "muted" | "rose"> = {
  draft: "default",
  registration: "green",
  live: "accent",
  completed: "muted",
  cancelled: "rose",
}

type Confirm =
  | { kind: "finalize" }
  | { kind: "delete" }
  | { kind: "cancelTournament" }
  | { kind: "resolve"; entered: number; dropped: number }
  | null

/**
 * The control room for one tournament. The header says where it is and what
 * comes next; the tabs split the work by concern so nothing irrelevant to the
 * current stage sits on screen.
 */
export function Manage({
  slug,
  tab,
  onTab,
  onBack,
}: {
  slug: string
  tab: ManageTab
  onTab: (tab: ManageTab) => void
  onBack: () => void
}) {
  const t = useTranslations("tournaments")
  const { tournament: tn, isLoading, refetch } = useTournament(slug)
  const [matches, setMatches] = useState<TnMatchApi[]>([])
  const [genOpen, setGenOpen] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [busy, setBusy] = useState(false)

  const loadMatches = useCallback(async () => {
    const r = await TournamentsService.getMatches(slug)
    if (r.data) setMatches(r.data)
  }, [slug])
  useEffect(() => { loadMatches() }, [loadMatches, tn?.status])
  const refreshAll = useCallback(() => { refetch(); loadMatches() }, [refetch, loadMatches])

  if (isLoading) return <div className="grid place-items-center py-16"><Spinner /></div>
  if (!tn) {
    return (
      <p className="py-8 font-mono text-txt-dim">
        {t("notFound")}{" "}
        <button onClick={onBack} className="text-accent">{t("back")}</button>
      </p>
    )
  }

  // ── actions ────────────────────────────────────────────────────────────────
  const setStatus = async (status: TnStatus, okMsg?: string) => {
    const r = await TournamentsService.setStatus(tn.id, status)
    if (r.error) { toast.error(r.error); return false }
    toast.success(okMsg ?? t("statusUpdated", { status: t(`statusLabel.${status}`) }))
    refreshAll()
    return true
  }
  const toggleRegistration = async () => {
    const opening = !registrationIsOpen(tn)
    if (opening && tn.status === "draft") {
      const st = await TournamentsService.setStatus(tn.id, "registration")
      if (st.error) return toast.error(st.error)
    }
    const r = await TournamentsService.update(tn.id, { registrationOpen: opening })
    if (r.error) toast.error(r.error)
    else { toast.success(opening ? t("regNowOpen") : t("regNowClosed")); refreshAll() }
  }
  const toggleCheckIn = async () => {
    const r = await TournamentsService.update(tn.id, { checkInOpen: !tn.checkInOpen })
    if (r.error) toast.error(r.error)
    else { toast.success(tn.checkInOpen ? t("closeCheckIn") : t("openCheckIn")); refreshAll() }
  }
  const askResolve = async () => {
    const pv = await TournamentsService.entryPreview(tn.id)
    setConfirm({
      kind: "resolve",
      entered: pv.data?.entered.length ?? 0,
      dropped: pv.data?.dropped.length ?? 0,
    })
  }
  const advance = async () => {
    const r = await TournamentsService.advance(tn.id)
    if (r.error) toast.error(r.error); else { toast.success(t("advancePhase")); refreshAll() }
  }
  const runConfirm = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      if (confirm.kind === "finalize") await setStatus("completed")
      else if (confirm.kind === "cancelTournament") await setStatus("cancelled", t("tournamentCancelled"))
      else if (confirm.kind === "resolve") {
        const r = await TournamentsService.resolveEntries(tn.id)
        if (r.error) toast.error(r.error)
        else { toast.success(t("fieldResolved", { dropped: r.data?.dropped.length ?? 0 })); refreshAll() }
      } else if (confirm.kind === "delete") {
        const r = await TournamentsService.remove(tn.id)
        if (r.error) { toast.error(r.error); return }
        toast(t("tournamentDeleted"))
        onBack()
        return
      }
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  // ── next action ────────────────────────────────────────────────────────────
  const next = nextAction(tn, matches)
  const genLabel = next?.kind === "generate" && next.round
    ? t("generateRound", { done: next.round.next, total: next.round.total })
    : t("generate")
  const primary = (() => {
    switch (next?.kind) {
      case "openReg": return { label: t("openReg"), icon: "check" as const, run: toggleRegistration }
      case "generate": return { label: genLabel, icon: "bolt" as const, run: () => setGenOpen(true) }
      case "publish": return { label: t("publish"), icon: "play" as const, run: () => setStatus("live") }
      case "report": return { label: t("next.report", { count: next.count }), icon: "edit" as const, run: () => onTab("matches") }
      case "advance": return { label: t("advancePhase"), icon: "bolt" as const, run: advance }
      case "finalize": return { label: t("finalize"), icon: "trophy" as const, run: () => setConfirm({ kind: "finalize" }) }
      case "reopen": return { label: t("next.reopen"), icon: "refresh" as const, run: () => setStatus("draft") }
      default: return null
    }
  })()

  const overviewActions: OverviewActions = {
    toggleRegistration,
    toggleCheckIn,
    resolveField: askResolve,
    openGenerate: () => setGenOpen(true),
    publish: () => setStatus("live"),
    goTab: onTab,
  }

  const fs = fieldStats(tn)
  const ms = matchStats(matches)
  const tabs = [
    { value: "overview", label: t("tabOverview") },
    { value: "config", label: t("tabConfig") },
    { value: "participants", label: t("tabParticipants"), count: fs.registered },
    { value: "matches", label: t("tabMatches"), count: ms.ready || undefined },
  ]

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Button size="sm" variant="ghost" icon="back" onClick={onBack}>{t("title")}</Button>
        <AvViewLink href={`/torneos/${tn.slug}`} label={t("viewPage")} className="ml-auto" />
      </div>

      <AvSectionHead
        title={tn.name}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            <TnFormatBadge format={tn.format} size="sm" />
            <AvPill tone={STATUS_TONE[tn.status]}>{t(`statusLabel.${tn.status}`)}</AvPill>
            <AvPill icon="users">{fs.registered}</AvPill>
            {tn.champion && <AvPill tone="accent" icon="trophy">{tn.champion.name}</AvPill>}
          </span>
        }
        actions={
          primary && (
            <Button variant="pri" icon={primary.icon} onClick={primary.run}>{primary.label}</Button>
          )
        }
      />

      <div className="mb-[18px] border border-solid border-line bg-panel px-4 py-3">
        <Stepper
          rail
          muted={tn.status === "cancelled"}
          steps={STAGES.map((s) => t(`stage.${s}`))}
          current={stageIndex(tn.status)}
        />
      </div>

      <Tabs tabs={tabs} value={tab} onChange={(v) => onTab(v as ManageTab)} className="mb-[18px]" />

      {tab === "overview" && (
        <OverviewTab tn={tn} matches={matches} actions={overviewActions} />
      )}
      {tab === "config" && (
        <ConfigTab
          tn={tn}
          onChange={refreshAll}
          onCancelTournament={() => setConfirm({ kind: "cancelTournament" })}
          onDelete={() => setConfirm({ kind: "delete" })}
        />
      )}
      {tab === "participants" && <EntrantsPanel detail={tn} onChange={refreshAll} />}
      {tab === "matches" && (
        <MatchesTab tn={tn} matches={matches} onChanged={refreshAll} openGenerate={() => setGenOpen(true)} />
      )}

      <GenerateDialog
        open={genOpen}
        tn={tn}
        label={genLabel}
        onClose={() => setGenOpen(false)}
        onGenerated={refreshAll}
      />
      <ConfirmDialog
        open={confirm != null}
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        tone={confirm?.kind === "delete" || confirm?.kind === "cancelTournament" ? "error" : "warning"}
        title={
          confirm?.kind === "finalize" ? t("confirmFinalizeTitle")
          : confirm?.kind === "delete" ? t("confirmDeleteTitle")
          : confirm?.kind === "cancelTournament" ? t("confirmCancelTitle")
          : t("confirmResolveTitle")
        }
        confirmLabel={
          confirm?.kind === "finalize" ? t("finalize")
          : confirm?.kind === "delete" ? t("delete")
          : confirm?.kind === "cancelTournament" ? t("cancelTournament")
          : t("resolveField")
        }
        body={
          confirm?.kind === "finalize" ? t("confirmFinalize", { name: tn.name })
          : confirm?.kind === "delete" ? t("confirmDelete", { name: tn.name })
          : confirm?.kind === "cancelTournament" ? t("confirmCancel", { name: tn.name })
          : confirm?.kind === "resolve" ? t("confirmResolve", { entered: confirm.entered, dropped: confirm.dropped })
          : null
        }
      />
    </div>
  )
}
