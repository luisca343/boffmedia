"use client"

import { useCallback, useEffect, useState } from "react"
import { Panel, Button, Select, Spinner, toast } from "@/components/boffmedia/primitives"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
import { TorneoView } from "../../torneos/_components/TorneoView"
import { TournamentsService, type TnMatchApi, type TnStatus } from "@/services/api/boffmedia/tournamentsService"
import { SectionHead, Stat } from "./tournaments-admin/shared"
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

// ── manage a single tournament ───────────────────────────────────────────────
function Manage({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { tournament: t, isLoading, refetch } = useTournament(slug)
  const [matches, setMatches] = useState<TnMatchApi[]>([])
  const [seeding, setSeeding] = useState("as-seeded")
  const [onlyCheckedIn, setOnlyCheckedIn] = useState(false)

  const loadMatches = useCallback(async () => {
    const r = await TournamentsService.getMatches(slug)
    if (r.data) setMatches(r.data)
  }, [slug])
  useEffect(() => { loadMatches() }, [loadMatches, t?.status])

  const refreshAll = () => { refetch(); loadMatches() }

  if (isLoading) return <div className="grid place-items-center py-16"><Spinner /></div>
  if (!t) return <p className="py-8 font-mono text-txt-dim">Torneo no encontrado. <button onClick={onBack} className="text-accent">Volver</button></p>

  const setStatus = async (status: TnStatus) => {
    const r = await TournamentsService.setStatus(t.id, status)
    if (r.error) toast.error(r.error); else { toast.success(`Estado: ${status}`); refetch() }
  }
  const finalize = async () => {
    if (!confirm(`¿Finalizar «${t.name}»? No podrá reabrirse.`)) return
    setStatus("completed")
  }
  const generate = async (preview = false) => {
    const body: Record<string, unknown> = { seeding }
    if (preview) body.preview = true
    if (onlyCheckedIn) body.onlyCheckedIn = true
    const r = await TournamentsService.generate(t.id, body)
    if (r.error) toast.error(r.error)
    else { toast.success(preview ? "Generado (borrador — no público)" : "Generado"); refreshAll() }
  }
  const toggleCheckInWindow = async () => {
    const r = await TournamentsService.update(t.id, { checkInOpen: !t.checkInOpen })
    if (r.error) toast.error(r.error)
    else { toast.success(t.checkInOpen ? "Check-in cerrado" : "Check-in abierto"); refetch() }
  }
  const advance = async () => {
    const r = await TournamentsService.advance(t.id)
    if (r.error) toast.error(r.error); else { toast.success("Fase avanzada"); refreshAll() }
  }
  const remove = async () => {
    if (!confirm(`¿Eliminar «${t.name}»? Esta acción no se puede deshacer.`)) return
    const r = await TournamentsService.remove(t.id)
    if (r.error) toast.error(r.error); else { toast("Torneo eliminado"); onBack() }
  }

  const livePhase = (t.phases ?? []).find((p) => p.status === "live")
  const multiPhase = (t.phases ?? []).length > 1
  const genLabel = (() => {
    if (livePhase?.format === "swiss") {
      const done = livePhase.view.rounds?.length ?? 0
      const total = livePhase.rounds ?? "?"
      return done > 0 ? `Generar ronda ${done + 1}/${total}` : "Generar"
    }
    return "Generar"
  })()

  const doneMatches = matches.filter((m) => m.status === "completed" || m.status === "bye").length
  const checkedIn = t.participants.filter((p) => p.checkedIn).length

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" icon="back" onClick={onBack}>Torneos</Button>
        <SectionHead title={t.name} sub={`${t.format} · ${t.status}`} />
        <a
          href={`/torneos/${t.slug}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 border border-solid border-line px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-txt-muted transition-colors hover:border-accent-line hover:text-accent-bright"
        >
          Ver página ↗
        </a>
      </div>

      <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(116px,1fr))]">
        <Stat label="Participantes" value={t.participants.length} />
        {t.checkInOpen && <Stat label="Check-in" value={`${checkedIn}/${t.participants.length}`} tone="text-ok" />}
        {matches.length > 0 && <Stat label="Partidas" value={`${doneMatches}/${matches.length}`} />}
        {multiPhase && livePhase && <Stat label="Fase" value={`${livePhase.order}/${(t.phases ?? []).length}`} tone="text-accent-bright" />}
        {livePhase?.format === "swiss" && (
          <Stat label="Ronda" value={`${livePhase.view.rounds?.length ?? 0}/${livePhase.rounds ?? "?"}`} />
        )}
        {t.champion && <Stat label="Campeón" value={`🏆 ${t.champion.name}`} tone="text-accent-bright" />}
      </div>

      <Panel title="Ciclo de vida" aside={<TnFormatBadge format={t.format} size="sm" />}>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setStatus("registration")}>Abrir inscripción</Button>
          <Button size="sm" onClick={toggleCheckInWindow}>
            {t.checkInOpen ? "Cerrar check-in" : "Abrir check-in"}
          </Button>
          <Button size="sm" variant="pri" icon="bolt" onClick={() => generate(false)}>{genLabel}</Button>
          {t.status !== "live" && t.status !== "completed" && (
            <Button size="sm" icon="eye" onClick={() => generate(true)}>Generar (borrador)</Button>
          )}
          {t.status !== "live" && t.status !== "completed" && (t.phases ?? []).some((p) => p.status === "live") && (
            <Button size="sm" variant="pri" onClick={() => setStatus("live")}>Publicar</Button>
          )}
          {multiPhase && (
            <Button size="sm" icon="bolt" disabled={!livePhase} onClick={advance}>Avanzar fase</Button>
          )}
          <Select
            value={seeding}
            onChange={setSeeding}
            className="w-auto"
            options={[
              { value: "as-seeded", label: "Por seed" },
              { value: "random", label: "Aleatorio" },
              { value: "as-added", label: "Orden de alta" },
            ]}
          />
          <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-txt-muted">
            <input type="checkbox" checked={onlyCheckedIn} onChange={(e) => setOnlyCheckedIn(e.target.checked)} />
            Solo con check-in
          </label>
          <Button size="sm" onClick={finalize}>Finalizar</Button>
          <Button size="sm" onClick={remove}>Eliminar</Button>
        </div>
      </Panel>

      <EditPanel detail={t} onChange={refetch} />

      <PhasesManager detail={t} onChange={refreshAll} />

      <EntrantsPanel detail={t} onChange={refreshAll} />

      {(t.status === "live" || t.status === "completed") && (
        <Panel title="Estado actual" aside={<span className="font-mono text-[10px] text-txt-dim">cuadro y clasificación</span>}>
          <TorneoView detail={t} />
        </Panel>
      )}

      <ReportPanel tid={t.id} bestOf={livePhase?.bestOf ?? t.bestOf} matches={matches} onReported={refreshAll} />
    </div>
  )
}
