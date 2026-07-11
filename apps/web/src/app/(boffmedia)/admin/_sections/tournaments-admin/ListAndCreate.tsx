"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Panel, Field, Input, Select, Button, toast, Spinner } from "@/components/boffmedia/primitives"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournaments } from "@/hooks/tournaments/useTournaments"
import { UsersService } from "@/services/api/boffmedia/usersService"
import {
  TournamentsService,
  type TnFormat,
  type TnKind,
  type TnMatchApi,
  type TnStatus,
  type TnPhaseApi,
  type TnPhaseInput,
  type TnPhaseFormat,
  type TnAdvanceType,
  type TnParticipantStatus,
  type TnCompetitorApi,
} from "@/services/api/boffmedia/tournamentsService"
import { FORMATS, KINDS, PHASE_FORMATS, ADVANCE_TYPE_OPTIONS, PARTICIPANT_STATUS, VGC_PRESET, PHASE_STATUS_TONE } from "./constants"
import { SectionHead, Stat } from "./shared"
import { PhasesEditor } from "./PhasesEditor"

// ── list + create ──────────────────────────────────────────────────────────────
export function ListAndCreate({ onSelect }: { onSelect: (slug: string) => void }) {
  const { tournaments, isLoading, refetch } = useTournaments()
  const [name, setName] = useState("")
  const [format, setFormat] = useState<TnFormat>("single")
  const [kind, setKind] = useState<TnKind>("solo")
  const [bestOf, setBestOf] = useState(1)
  const [metric, setMetric] = useState<"score" | "time">("score")
  const [unit, setUnit] = useState("pts")
  const [groupCount, setGroupCount] = useState(2)
  const [advanceCount, setAdvanceCount] = useState(2)
  const [maxParticipants, setMaxParticipants] = useState<number | "">("")
  const [phases, setPhases] = useState<TnPhaseInput[]>([])
  const [busy, setBusy] = useState(false)

  const create = async () => {
    if (!name.trim()) return toast.error("El nombre es obligatorio")
    setBusy(true)
    // Multi-phase tournaments store the decisive (final) phase's format as the
    // headline/list-card label; the detail renders from phases.
    const headlineFormat = phases.length > 0 ? phases[phases.length - 1].format : format
    const body: Record<string, unknown> = {
      name: name.trim(),
      format: headlineFormat,
      competitorKind: kind,
      bestOf,
      registrationOpen: true,
    }
    if (headlineFormat === "leaderboard") { body.metric = metric; body.unit = unit }
    if (headlineFormat === "groups") { body.groupCount = groupCount; body.advanceCount = advanceCount }
    if (maxParticipants !== "") body.maxParticipants = maxParticipants
    if (phases.length > 0) body.phases = phases
    const r = await TournamentsService.create(body)
    setBusy(false)
    if (r.error || !r.data) return toast.error(r.error ?? "Error al crear")
    toast.success("Torneo creado")
    setName("")
    setPhases([])
    refetch()
    onSelect(r.data.slug)
  }

  return (
    <div className="grid gap-5">
      <SectionHead title="Torneos" sub="Crea y gestiona torneos de la comunidad" />

      <Panel title="Nuevo torneo">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Copa Boffmedia" />
          </Field>
          <Field label="Formato">
            <Select value={format} options={[...FORMATS]} onChange={(v) => setFormat(v as TnFormat)} />
          </Field>
          <Field label="Tipo de competidor">
            <Select value={kind} options={[...KINDS]} onChange={(v) => setKind(v as TnKind)} />
          </Field>
          <Field label="Al mejor de (BO)">
            <Input type="number" min={1} value={bestOf} onChange={(e) => setBestOf(Math.max(1, +e.target.value || 1))} />
          </Field>
          {format === "leaderboard" && (
            <>
              <Field label="Métrica">
                <Select value={metric} options={["score", "time"]} onChange={(v) => setMetric(v as "score" | "time")} />
              </Field>
              <Field label="Unidad">
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pts" />
              </Field>
            </>
          )}
          {format === "groups" && (
            <>
              <Field label="Nº de grupos">
                <Input type="number" min={1} value={groupCount} onChange={(e) => setGroupCount(Math.max(1, +e.target.value || 1))} />
              </Field>
              <Field label="Clasifican por grupo">
                <Input type="number" min={1} value={advanceCount} onChange={(e) => setAdvanceCount(Math.max(1, +e.target.value || 1))} />
              </Field>
            </>
          )}
          <Field label="Máx. participantes (opcional)">
            <Input type="number" min={2} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value === "" ? "" : Math.max(2, +e.target.value))} />
          </Field>
        </div>

        <PhasesEditor phases={phases} onChange={setPhases} />

        <div className="mt-3 flex justify-end">
          <Button variant="pri" size="sm" icon="plus" disabled={busy} onClick={create}>Crear torneo</Button>
        </div>
      </Panel>

      <Panel title="Torneos">
        {isLoading ? (
          <div className="grid place-items-center py-8"><Spinner /></div>
        ) : tournaments.length === 0 ? (
          <p className="py-4 font-mono text-[12px] text-txt-dim">No hay torneos.</p>
        ) : (
          <div className="grid gap-1.5">
            {tournaments.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.slug)}
                className="flex items-center gap-3 border border-solid border-line bg-base px-3 py-2 text-left transition-colors hover:border-line-2"
              >
                <TnFormatBadge format={t.format} size="sm" />
                <span className="flex-1 truncate font-body text-[13px] font-semibold">{t.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-txt-dim">{t.status}</span>
                <span className="font-mono text-[10px] text-txt-muted">{t.participantCount}👤</span>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
