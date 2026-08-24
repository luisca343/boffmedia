"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Panel, Button, Select, Spinner, toast } from "@boffmedia/ui"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
import { TorneoView } from "../../torneos/_components/TorneoView"
import { TournamentsService, type TnMatchApi, type TnStatus } from "@/services/api/boffmedia/tournamentsService"
import { SectionHead } from "./tournaments-admin/shared"
import { AvMetric, AvMetrics } from "../_components/ui/av-kit"
import { ListAndCreate } from "./tournaments-admin/ListAndCreate"
import { EditPanel } from "./tournaments-admin/EditPanel"
import { EntrantsPanel } from "./tournaments-admin/EntrantsPanel"
import { ReportPanel } from "./tournaments-admin/ReportPanel"
import { PhasesManager } from "./tournaments-admin/PhasesEditor"

export function TournamentsAdmin() {
  const [sel, setSel] = useState<string | null>(null)
  return sel ? (
    <Manage slug={sel} onBack={() => setSel(null)} />
  ) : (
    <ListAndCreate onSelect={setSel} />
  )
}

function Manage({ slug, onBack }: { slug: string; onBack: () => void }) {
  const t = useTranslations("tournaments")
  const { tournament: tn, isLoading, refetch } = useTournament(slug)
  const [matches, setMatches] = useState<TnMatchApi[]>([])
  const [seeding, setSeeding] = useState("as-seeded")
  const [onlyCheckedIn, setOnlyCheckedIn] = useState(false)

  const loadMatches = useCallback(async () => {
    const r = await TournamentsService.getMatches(slug)
    if (r.data) setMatches(r.data)
  }, [slug])
  useEffect(() => { loadMatches() }, [loadMatches, tn?.status])

  const refreshAll = () => { refetch(); loadMatches() }

  if (isLoading) return <div className="grid place-items-center py-16"><Spinner /></div>
  if (!tn) return <p className="py-8 font-mono text-txt-dim">{t("notFound")} <button onClick={onBack} className="text-accent">{t("back")}</button></p>

  const setStatus = async (status: TnStatus) => {
    const r = await TournamentsService.setStatus(tn.id, status)
    if (r.error) toast.error(r.error); else { toast.success(t("statusUpdated", { status })); refetch() }
  }
  const finalize = async () => {
    if (!confirm(t("confirmFinalize", { name: tn.name }))) return
    setStatus("completed")
  }
  const generate = async (preview = false) => {
    const body: Record<string, unknown> = { seeding }
    if (preview) body.preview = true
    if (onlyCheckedIn) body.onlyCheckedIn = true
    const r = await TournamentsService.generate(tn.id, body)
    if (r.error) toast.error(r.error)
    else { toast.success(preview ? t("generatedDraft") : t("generated")); refreshAll() }
  }
  const toggleCheckInWindow = async () => {
    const r = await TournamentsService.update(tn.id, { checkInOpen: !tn.checkInOpen })
    if (r.error) toast.error(r.error)
    else { toast.success(tn.checkInOpen ? t("closeCheckIn") : t("openCheckIn")); refetch() }
  }
  const advance = async () => {
    const r = await TournamentsService.advance(tn.id)
    if (r.error) toast.error(r.error); else { toast.success(t("advancePhase")); refreshAll() }
  }
  const remove = async () => {
    if (!confirm(t("confirmDelete", { name: tn.name }))) return
    const r = await TournamentsService.remove(tn.id)
    if (r.error) toast.error(r.error); else { toast(t("tournamentDeleted")); onBack() }
  }

  const livePhase = (tn.phases ?? []).find((p) => p.status === "live")
  const multiPhase = (tn.phases ?? []).length > 1
  const genLabel = (() => {
    if (livePhase?.format === "swiss") {
      const done = livePhase.view.rounds?.length ?? 0
      const total = livePhase.rounds ?? "?"
      return done > 0 ? t("generateRound", { done: done + 1, total }) : t("generate")
    }
    return t("generate")
  })()

  const doneMatches = matches.filter((m) => m.status === "completed" || m.status === "bye").length
  const checkedIn = tn.participants.filter((p) => p.checkedIn).length

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" icon="back" onClick={onBack}>{t("title")}</Button>
        <SectionHead title={tn.name} sub={`${tn.format} · ${tn.status}`} />
        <a
          href={`/torneos/${tn.slug}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 border border-solid border-line px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-txt-muted transition-colors hover:border-accent-line hover:text-accent-bright"
        >
          {t("viewPage")}
        </a>
      </div>

      {/* av-* is the admin panel's canonical kit; this row used to be a local
          `Stat` fork of AvMetric that also wore the pill parallelogram. */}
      <AvMetrics className="[grid-template-columns:repeat(auto-fit,minmax(116px,1fr))]">
        <AvMetric label={t("participants")} value={tn.participants.length} />
        {tn.checkInOpen && <AvMetric label={t("checkIn")} value={`${checkedIn}/${tn.participants.length}`} tone="pos" />}
        {matches.length > 0 && <AvMetric label={t("matches")} value={`${doneMatches}/${matches.length}`} />}
        {multiPhase && livePhase && <AvMetric label={t("phase")} value={`${livePhase.order}/${(tn.phases ?? []).length}`} tone="accent" />}
        {livePhase?.format === "swiss" && (
          <AvMetric label={t("round")} value={`${livePhase.view.rounds?.length ?? 0}/${livePhase.rounds ?? "?"}`} />
        )}
        {tn.champion && <AvMetric label={t("champion")} value={`🏆 ${tn.champion.name}`} tone="accent" />}
      </AvMetrics>

      <Panel title={t("lifecycle")} aside={<TnFormatBadge format={tn.format} size="sm" />}>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setStatus("registration")}>{t("openReg")}</Button>
          <Button size="sm" onClick={toggleCheckInWindow}>
            {tn.checkInOpen ? t("closeCheckIn") : t("openCheckIn")}
          </Button>
          <Button size="sm" variant="pri" icon="bolt" onClick={() => generate(false)}>{genLabel}</Button>
          {tn.status !== "live" && tn.status !== "completed" && (
            <Button size="sm" icon="eye" onClick={() => generate(true)}>{t("generateDraft")}</Button>
          )}
          {tn.status !== "live" && tn.status !== "completed" && (tn.phases ?? []).some((p) => p.status === "live") && (
            <Button size="sm" variant="pri" onClick={() => setStatus("live")}>{t("publish")}</Button>
          )}
          {multiPhase && (
            <Button size="sm" icon="bolt" disabled={!livePhase} onClick={advance}>{t("advancePhase")}</Button>
          )}
          <Select
            value={seeding}
            onChange={setSeeding}
            className="w-auto"
            options={[
              { value: "as-seeded", label: t("seedAsSeeded") },
              { value: "random", label: t("seedRandom") },
              { value: "as-added", label: t("seedAsAdded") },
            ]}
          />
          <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-txt-muted">
            <input type="checkbox" checked={onlyCheckedIn} onChange={(e) => setOnlyCheckedIn(e.target.checked)} />
            {t("onlyCheckedIn")}
          </label>
          <Button size="sm" onClick={finalize}>{t("finalize")}</Button>
          <Button size="sm" onClick={remove}>{t("delete")}</Button>
        </div>
      </Panel>

      <EditPanel detail={tn} onChange={refetch} />

      <PhasesManager detail={tn} onChange={refreshAll} />

      <EntrantsPanel detail={tn} onChange={refreshAll} />

      {(tn.status === "live" || tn.status === "completed") && (
        <Panel title={t("stateCurrent")} aside={<span className="font-mono text-[10px] text-txt-dim">{t("stateBracket")}</span>}>
          <TorneoView detail={tn} />
        </Panel>
      )}

      <ReportPanel tid={tn.id} bestOf={livePhase?.bestOf ?? tn.bestOf} matches={matches} onReported={refreshAll} />
    </div>
  )
}
