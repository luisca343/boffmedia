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

// ── edit tournament meta ─────────────────────────────────────────────────────
export function EditPanel({
  detail,
  onChange,
}: {
  detail: NonNullable<ReturnType<typeof useTournament>["tournament"]>
  onChange: () => void
}) {
  const toLocal = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : ""
  const [name, setName] = useState(detail.name)
  const [description, setDescription] = useState(detail.description ?? "")
  const [rules, setRules] = useState(detail.rules ?? "")
  const [prizes, setPrizes] = useState(detail.prizes ?? "")
  const [banner, setBanner] = useState(detail.banner ?? "")
  const [bestOf, setBestOf] = useState(detail.bestOf)
  const [autoVerify, setAutoVerify] = useState<number | "">(detail.autoVerifyMinutes ?? "")
  const [maxParticipants, setMaxParticipants] = useState<number | "">(detail.maxParticipants ?? "")
  const [regOpen, setRegOpen] = useState(detail.registrationOpen)
  const [startDate, setStartDate] = useState(toLocal(detail.startDate))
  const [endDate, setEndDate] = useState(toLocal(detail.endDate))
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  const save = async () => {
    if (!name.trim()) return toast.error("El nombre es obligatorio")
    setBusy(true)
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      rules: rules.trim() || null,
      prizes: prizes.trim() || null,
      banner: banner.trim() || null,
      bestOf,
      autoVerifyMinutes: autoVerify === "" ? null : autoVerify,
      maxParticipants: maxParticipants === "" ? null : maxParticipants,
      registrationOpen: regOpen,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
    }
    const r = await TournamentsService.update(detail.id, body)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else { toast.success("Torneo actualizado"); onChange() }
  }

  return (
    <Panel
      title="Editar torneo"
      aside={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="font-mono text-[11px] text-accent transition-opacity hover:opacity-70"
        >
          {open ? "Ocultar" : "Editar"}
        </button>
      }
    >
      {open && (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Banner (URL)">
              <Input value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Al mejor de (BO)">
              <Input type="number" min={1} value={bestOf} onChange={(e) => setBestOf(Math.max(1, +e.target.value || 1))} />
            </Field>
            <Field label="Máx. participantes">
              <Input type="number" min={2} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value === "" ? "" : Math.max(2, +e.target.value))} />
            </Field>
            <Field label="Auto-verificación (min · vacío = 10)">
              <Input type="number" min={1} value={autoVerify} onChange={(e) => setAutoVerify(e.target.value === "" ? "" : Math.max(1, +e.target.value))} placeholder="10" />
            </Field>
            <Field label="Inscripción">
              <Select
                value={regOpen ? "yes" : "no"}
                options={[{ value: "yes", label: "Abierta" }, { value: "no", label: "Cerrada" }]}
                onChange={(v) => setRegOpen(v === "yes")}
              />
            </Field>
            <Field label="Inicio">
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Fin">
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Descripción">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-y border border-solid border-line bg-base px-2 py-1.5 font-body text-[13px]"
            />
          </Field>
          <Field label="Reglas">
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              className="w-full resize-y border border-solid border-line bg-base px-2 py-1.5 font-body text-[13px]"
            />
          </Field>
          <Field label="Premios">
            <textarea
              value={prizes}
              onChange={(e) => setPrizes(e.target.value)}
              rows={2}
              placeholder={"1º — 50€\n2º — 25€"}
              className="w-full resize-y border border-solid border-line bg-base px-2 py-1.5 font-body text-[13px]"
            />
          </Field>
          <div className="flex justify-end">
            <Button variant="pri" size="sm" disabled={busy} onClick={save}>Guardar cambios</Button>
          </div>
        </div>
      )}
    </Panel>
  )
}
