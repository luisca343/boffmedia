"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Panel, Field, Input, Select, Button, toast, Spinner } from "@/components/boffmedia/primitives"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournaments } from "@/hooks/tournaments/useTournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
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

// ── phase authoring (create form) ────────────────────────────────────────────
export function PhasesEditor({
  phases,
  onChange,
}: {
  phases: TnPhaseInput[]
  onChange: (p: TnPhaseInput[]) => void
}) {
  const update = (i: number, patch: Partial<TnPhaseInput>) =>
    onChange(phases.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const add = () =>
    onChange([...phases, { name: `Fase ${phases.length + 1}`, format: "swiss" }])
  const remove = (i: number) => onChange(phases.filter((_, j) => j !== i))
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= phases.length) return
    const next = [...phases]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="mt-4 border-t border-dashed border-line pt-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim">
          Fases (opcional · vacío = fase única con el formato de arriba)
        </span>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onChange(VGC_PRESET.map((p) => ({ ...p })))}>
            Preset VGC oficial
          </Button>
          <Button size="sm" icon="plus" onClick={add}>Fase</Button>
        </div>
      </div>
      {phases.length === 0 ? (
        <p className="font-mono text-[11px] text-txt-dim">
          Sin fases definidas: se usará el formato de arriba como fase única.
        </p>
      ) : (
        <div className="grid gap-2">
          {phases.map((p, i) => {
            const isLast = i === phases.length - 1
            return (
              <div key={i} className="border border-solid border-line bg-base p-2">
                <div className="mb-2 flex items-center gap-2">
                  <span className="w-12 font-mono text-[10px] text-txt-dim">Fase {i + 1}</span>
                  <Input value={p.name} onChange={(e) => update(i, { name: e.target.value })} className="flex-1" />
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-txt-dim transition-colors hover:text-txt disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={isLast} className="px-1 text-txt-dim transition-colors hover:text-txt disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => remove(i)} className="px-1 text-txt-dim transition-colors hover:text-bad">✕</button>
                </div>
                <PhaseFields p={p} isFirst={i === 0} isLast={isLast} upd={(patch) => update(i, patch)} />
              </div>
            )
          })}
          <p className="font-mono text-[10px] text-txt-dim">
            La última fase es la final (sin regla de avance). El torneo se listará como «{phases[phases.length - 1].format}».
          </p>
        </div>
      )}
    </div>
  )
}

// ── phase manager (manage view: view all, edit/remove pending, append) ─────────
export function PhasesManager({
  detail,
  onChange,
}: {
  detail: NonNullable<ReturnType<typeof useTournament>["tournament"]>
  onChange: () => void
}) {
  const phases = (detail.phases ?? []).filter((p) => p.id > 0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const canAppend = detail.status !== "completed" && detail.status !== "cancelled"

  if (phases.length === 0) return null
  const maxOrder = Math.max(...phases.map((p) => p.order))

  const append = async () => {
    const r = await TournamentsService.addPhase(detail.id, {
      name: `Fase ${phases.length + 1}`,
      format: "swiss",
    })
    if (r.error) toast.error(r.error); else { toast.success("Fase añadida"); onChange() }
  }
  const removePhase = async (p: TnPhaseApi) => {
    if (!confirm(`¿Eliminar la fase «${p.name}»?`)) return
    const r = await TournamentsService.removePhase(detail.id, p.id)
    if (r.error) toast.error(r.error); else { toast("Fase eliminada"); onChange() }
  }

  return (
    <Panel
      title="Fases"
      aside={
        canAppend ? (
          <button type="button" onClick={append} className="font-mono text-[11px] text-accent transition-opacity hover:opacity-70">
            + Añadir fase
          </button>
        ) : undefined
      }
    >
      <div className="grid gap-2">
        {phases.map((p) => {
          const isLast = p.order === maxOrder
          if (editingId === p.id && p.status === "pending") {
            return (
              <PhaseRowEditor
                key={p.id}
                detail={detail}
                phase={p}
                isLast={isLast}
                onClose={() => setEditingId(null)}
                onChange={() => { setEditingId(null); onChange() }}
              />
            )
          }
          return (
            <div key={p.id} className={cn("border border-solid bg-base px-3 py-2", PHASE_STATUS_TONE[p.status] ?? "border-line")}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-body text-[12.5px] font-semibold">
                  {p.order}. {p.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.08em]">{p.status}</span>
                  {p.status === "pending" && (
                    <>
                      <button type="button" onClick={() => setEditingId(p.id)} className="font-mono text-[10px] text-accent transition-opacity hover:opacity-70">editar</button>
                      <button type="button" onClick={() => removePhase(p)} className="text-txt-dim transition-colors hover:text-bad">✕</button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-1 font-mono text-[10px] text-txt-dim">
                {p.format}{p.rounds ? ` · ${p.rounds}r` : ""} · {p.entrantCount}👤
                {p.qualifiedCount != null ? ` · clasifican ${p.qualifiedCount}` : ""}
                {p.advance
                  ? ` · ${p.advance.type === "record" ? `≤${p.advance.maxLosses ?? 0} derrotas` : p.advance.type === "top_n" ? `top ${p.advance.count ?? ""}` : p.advance.type === "top_or_record" ? `top ${p.advance.count ?? ""} + ≤${p.advance.maxLosses ?? 0} derrotas` : "todos avanzan"}`
                  : isLast ? " · final" : ""}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function PhaseRowEditor({
  detail,
  phase,
  isLast,
  onClose,
  onChange,
}: {
  detail: NonNullable<ReturnType<typeof useTournament>["tournament"]>
  phase: TnPhaseApi
  isLast: boolean
  onClose: () => void
  onChange: () => void
}) {
  const [draft, setDraft] = useState<TnPhaseInput>({
    name: phase.name,
    format: phase.format,
    rounds: phase.rounds ?? undefined,
    finalsBestOf: phase.finalsBestOf ?? undefined,
    groupCount: phase.groupCount ?? undefined,
    thirdPlace: phase.thirdPlace,
    carryStandings: phase.carryStandings,
    advanceType: phase.advance?.type,
    advanceCount: phase.advance?.count ?? undefined,
    advanceMaxLosses: phase.advance?.maxLosses ?? undefined,
  })
  const [busy, setBusy] = useState(false)
  const upd = (patch: Partial<TnPhaseInput>) => setDraft((d) => ({ ...d, ...patch }))

  const save = async () => {
    setBusy(true)
    const r = await TournamentsService.updatePhase(detail.id, phase.id, draft)
    setBusy(false)
    if (r.error) toast.error(r.error); else { toast.success("Fase actualizada"); onChange() }
  }

  return (
    <div className="border border-solid border-accent-line bg-base p-2">
      <div className="mb-2 flex items-center gap-2">
        <span className="w-12 font-mono text-[10px] text-txt-dim">Fase {phase.order}</span>
        <Input value={draft.name} onChange={(e) => upd({ name: e.target.value })} className="flex-1" />
      </div>
      <PhaseFields p={draft} isFirst={phase.order === 1} isLast={isLast} upd={upd} />
      <div className="mt-2 flex justify-end gap-2">
        <Button size="sm" onClick={onClose}>Cancelar</Button>
        <Button variant="pri" size="sm" disabled={busy} onClick={save}>Guardar</Button>
      </div>
    </div>
  )
}

/** Shared per-phase config fields (create editor + manage editor). */
function PhaseFields({
  p,
  isFirst,
  isLast,
  upd,
}: {
  p: TnPhaseInput
  isFirst: boolean
  isLast: boolean
  upd: (patch: Partial<TnPhaseInput>) => void
}) {
  const advType = p.advanceType ?? "record"
  const isGroups = p.format === "groups"
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Field label="Formato">
        <Select
          value={p.format}
          options={[...PHASE_FORMATS]}
          onChange={(v) => {
            const format = v as TnPhaseFormat
            // Groups can't carry standings; their advancement is per-group top N.
            upd(
              format === "groups"
                ? { format, carryStandings: false, advanceType: "top_n", advanceCount: p.advanceCount ?? 2 }
                : { format },
            )
          }}
        />
      </Field>
      {p.format === "swiss" && (
        <Field label="Rondas">
          <Input type="number" min={1} value={p.rounds ?? ""} onChange={(e) => upd({ rounds: e.target.value === "" ? undefined : Math.max(1, +e.target.value) })} />
        </Field>
      )}
      {isGroups && (
        <Field label="Nº de grupos">
          <Input type="number" min={1} value={p.groupCount ?? 2} onChange={(e) => upd({ groupCount: Math.max(1, +e.target.value || 1) })} />
        </Field>
      )}
      {(p.format === "single" || p.format === "double") && (
        <Field label="BO de la final (opcional)">
          <Input type="number" min={1} value={p.finalsBestOf ?? ""} onChange={(e) => upd({ finalsBestOf: e.target.value === "" ? undefined : Math.max(1, +e.target.value) })} />
        </Field>
      )}
      {p.format === "single" && (
        <Field label="Tercer puesto">
          <Select
            value={p.thirdPlace ? "yes" : "no"}
            options={[{ value: "no", label: "No" }, { value: "yes", label: "Sí" }]}
            onChange={(v) => upd({ thirdPlace: v === "yes" })}
          />
        </Field>
      )}
      {!isFirst && !isGroups && (
        <Field label="Registro previo">
          <Select
            value={p.carryStandings ? "yes" : "no"}
            options={[{ value: "no", label: "Reiniciar" }, { value: "yes", label: "Arrastrar (carry)" }]}
            onChange={(v) => upd({ carryStandings: v === "yes" })}
          />
        </Field>
      )}
      <Field label="Desempate">
        <Select
          value={p.tiebreakProfile ?? "points"}
          options={[{ value: "points", label: "Puntos" }, { value: "resistance", label: "Resistencia" }]}
          onChange={(v) => upd({ tiebreakProfile: v as "points" | "resistance" })}
        />
      </Field>
      {!isLast &&
        (isGroups ? (
          <Field label="Clasifican por grupo">
            <Input type="number" min={1} value={p.advanceCount ?? 2} onChange={(e) => upd({ advanceCount: Math.max(1, +e.target.value || 1), advanceType: "top_n" })} />
          </Field>
        ) : (
          <>
            <Field label="Avance">
              <Select value={advType} options={ADVANCE_TYPE_OPTIONS} onChange={(v) => upd({ advanceType: v as TnAdvanceType })} />
            </Field>
            {(advType === "top_n" || advType === "top_or_record") && (
              <Field label="Top N">
                <Input type="number" min={1} value={p.advanceCount ?? 8} onChange={(e) => upd({ advanceCount: Math.max(1, +e.target.value) })} />
              </Field>
            )}
            {(advType === "record" || advType === "top_or_record") && (
              <Field label="Máx. derrotas">
                <Input type="number" min={0} value={p.advanceMaxLosses ?? 2} onChange={(e) => upd({ advanceMaxLosses: Math.max(0, +e.target.value) })} />
              </Field>
            )}
            {advType === "top_or_record" && (
              <p className="font-mono text-[10px] leading-[1.4] text-txt-dim sm:col-span-3">
                Avanzan los <b>top N</b> y además <b>todos</b> los que tengan ≤ derrotas — corte asimétrico (byes para los cabezas de serie sobrantes).
              </p>
            )}
          </>
        ))}
    </div>
  )
}

/** Bulk-set the scheduled time for every match of one round. */
export function RoundScheduler({
  tid,
  items,
  onScheduled,
}: {
  tid: number
  items: TnMatchApi[]
  onScheduled: () => void
}) {
  const existing = items.find((m) => m.scheduledAt)?.scheduledAt ?? null
  const toLocal = (iso: string | null) => {
    if (!iso) return ""
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }
  const [value, setValue] = useState(toLocal(existing))
  const [busy, setBusy] = useState(false)

  const apply = async () => {
    setBusy(true)
    const iso = value ? new Date(value).toISOString() : null
    const r = await TournamentsService.schedule(tid, items.map((m) => m.id), iso)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else { toast.success(iso ? "Ronda programada" : "Horario borrado"); onScheduled() }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border border-solid border-line bg-panel px-1.5 py-0.5 font-mono text-[10.5px] text-txt-muted"
        title="Horario de la ronda"
      />
      <button
        type="button"
        disabled={busy}
        onClick={apply}
        className="font-mono text-[10px] text-accent transition-opacity hover:opacity-70 disabled:opacity-40"
      >
        {value ? "Programar" : existing ? "Borrar horario" : "Programar"}
      </button>
    </span>
  )
}
