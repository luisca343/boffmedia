"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Panel, Field, Input, Select, Button, toast } from "@/components/boffmedia/primitives"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournaments } from "@/hooks/tournaments/useTournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
import { TorneoView } from "../../torneos/_components/TorneoView"
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

const FORMATS: TnFormat[] = ["single", "double", "groups", "roundrobin", "swiss", "leaderboard"]
const KINDS: TnKind[] = ["solo", "team", "entry"]
const PHASE_FORMATS: TnPhaseFormat[] = ["swiss", "single", "double", "roundrobin", "groups", "leaderboard"]
const ADVANCE_TYPE_OPTIONS: { value: TnAdvanceType; label: string }[] = [
  { value: "record", label: "Récord (≤ derrotas)" },
  { value: "top_n", label: "Top N" },
  { value: "top_or_record", label: "Top N + récord (unión)" },
  { value: "all", label: "Todos avanzan" },
]
const PARTICIPANT_STATUS: { value: TnParticipantStatus; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "eliminated", label: "Eliminado" },
  { value: "withdrew", label: "Retirado" },
  { value: "disqualified", label: "Descalificado" },
]

// Official Pokémon VGC regional shape: Day 1 swiss (X-2 or better make Day 2) →
// Day 2 swiss (carry) → Top Cut = top 8 PLUS everyone still at X-2 (asymmetric).
const VGC_PRESET: TnPhaseInput[] = [
  { name: "Día 1 — Suizo", format: "swiss", rounds: 9, advanceType: "record", advanceMaxLosses: 2, tiebreakProfile: "resistance" },
  { name: "Día 2 — Suizo", format: "swiss", rounds: 5, carryStandings: true, advanceType: "top_or_record", advanceCount: 8, advanceMaxLosses: 2, tiebreakProfile: "resistance" },
  { name: "Top Cut", format: "single", thirdPlace: true, tiebreakProfile: "resistance" },
]

const PHASE_STATUS_TONE: Record<string, string> = {
  live: "text-accent-bright border-accent-line",
  completed: "text-txt-muted border-line-2",
  pending: "text-txt-dim border-line",
}

export function TournamentsAdmin() {
  const [sel, setSel] = useState<string | null>(null)
  return sel ? (
    <Manage slug={sel} onBack={() => setSel(null)} />
  ) : (
    <ListAndCreate onSelect={setSel} />
  )
}

// ── list + create ──────────────────────────────────────────────────────────────
function ListAndCreate({ onSelect }: { onSelect: (slug: string) => void }) {
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: string
}) {
  return (
    <div className="cut border border-solid border-line bg-base px-3 py-2 [--cut:5px]">
      <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-txt-dim">{label}</div>
      <div className={cn("truncate font-display text-[19px] font-bold not-italic leading-tight", tone ?? "text-txt")}>
        {value}
      </div>
    </div>
  )
}

// ── edit tournament meta ─────────────────────────────────────────────────────
function EditPanel({
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

interface PickUser {
  id: number
  username: string
  profilePicture?: string | null
}

function EntrantsPanel({
  detail,
  onChange,
}: {
  detail: NonNullable<ReturnType<typeof useTournament>["tournament"]>
  onChange: () => void
}) {
  const [name, setName] = useState("")
  const [seed, setSeed] = useState<number | "">("")
  const [country, setCountry] = useState("")
  const [score, setScore] = useState<number | "">("")
  const isLb = detail.format === "leaderboard"

  // Real-user picker: fetch the roster once, filter client-side by username.
  const [userQuery, setUserQuery] = useState("")
  const [allUsers, setAllUsers] = useState<PickUser[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const ensureUsers = async () => {
    if (usersLoaded) return
    setUsersLoaded(true)
    const r = await UsersService.getUsers(2000)
    const list = ((r.data as { users?: PickUser[] } | undefined)?.users ?? []) as PickUser[]
    setAllUsers(list.map((u) => ({ id: u.id, username: u.username, profilePicture: u.profilePicture })))
  }

  const existing = new Set(detail.participants.map((p) => p.name.toLowerCase()))
  const matches =
    userQuery.trim().length >= 1
      ? allUsers
          .filter(
            (u) =>
              u.username.toLowerCase().includes(userQuery.trim().toLowerCase()) &&
              !existing.has(u.username.toLowerCase()),
          )
          .slice(0, 8)
      : []

  const addUser = async (u: PickUser) => {
    const r = await TournamentsService.addParticipant(detail.id, { userId: u.id, name: u.username })
    if (r.error) toast.error(r.error)
    else { setUserQuery(""); onChange() }
  }

  const addGuest = async () => {
    if (!name.trim()) return toast.error("Nombre requerido")
    const body: Record<string, unknown> = { name: name.trim() }
    if (seed !== "") body.seed = seed
    if (country.trim()) body.country = country.trim().toUpperCase()
    if (isLb && score !== "") body.score = score
    const r = await TournamentsService.addParticipant(detail.id, body)
    if (r.error) toast.error(r.error)
    else { setName(""); setSeed(""); setCountry(""); setScore(""); onChange() }
  }
  const remove = async (pid: string) => {
    const r = await TournamentsService.removeParticipant(detail.id, Number(pid))
    if (r.error) toast.error(r.error); else onChange()
  }
  const updateP = async (pid: string, body: Record<string, unknown>) => {
    const r = await TournamentsService.updateParticipant(detail.id, Number(pid), body)
    if (r.error) toast.error(r.error); else onChange()
  }

  return (
    <Panel title={`Participantes (${detail.participants.length})`}>
      {/* Add a real registered user (real name + avatar). Results render inline
          (not an absolute overlay) so the Panel's cut-corner clip-path can't clip
          them when the panel is short — e.g. before any players are added. */}
      {!isLb && (
        <div className="mb-3">
          <Field label="Añadir usuario registrado">
            <Input
              value={userQuery}
              onFocus={ensureUsers}
              onChange={(e) => { ensureUsers(); setUserQuery(e.target.value) }}
              placeholder="Buscar por nombre de usuario…"
            />
          </Field>
          {matches.length > 0 && (
            <div className="mt-1 max-h-64 w-full max-w-md overflow-y-auto border border-solid border-line-2 bg-panel shadow-lg">
              {matches.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => addUser(u)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-panel-2"
                >
                  <span className="grid h-6 w-6 flex-none place-items-center overflow-hidden border border-line bg-base font-mono text-[10px] text-txt-dim">
                    {u.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.profilePicture} alt="" className="h-full w-full object-cover" />
                    ) : (
                      u.username.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="flex-1 truncate font-body text-[12.5px]">{u.username}</span>
                  <span className="font-mono text-[10px] text-accent">+ Añadir</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add a guest / manual entry (also the leaderboard entry form). */}
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Field label={isLb ? "Entrada" : "Invitado (nombre manual)"}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        {!isLb && <Field label="Seed"><Input type="number" value={seed} onChange={(e) => setSeed(e.target.value === "" ? "" : +e.target.value)} className="w-20" /></Field>}
        <Field label="País"><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="ES" className="w-20" /></Field>
        {isLb && <Field label="Score"><Input type="number" value={score} onChange={(e) => setScore(e.target.value === "" ? "" : +e.target.value)} className="w-24" /></Field>}
        <Button size="sm" icon="plus" onClick={addGuest}>Añadir</Button>
      </div>

      <div className="grid gap-1">
        {detail.participants.map((p) => (
          <EntrantRow
            key={p.id}
            p={p}
            isLb={isLb}
            onUpdate={(body) => updateP(p.id, body)}
            onRemove={() => remove(p.id)}
          />
        ))}
      </div>
    </Panel>
  )
}

/** One entrant row with inline seed/status editing (score/verified for leaderboards). */
function EntrantRow({
  p,
  isLb,
  onUpdate,
  onRemove,
}: {
  p: TnCompetitorApi
  isLb: boolean
  onUpdate: (body: Record<string, unknown>) => void
  onRemove: () => void
}) {
  const [seed, setSeed] = useState<number | "">(p.seed ?? "")
  const [score, setScore] = useState<number | "">(p.score ?? "")

  const commitSeed = () => {
    const next = seed === "" ? null : seed
    if (next !== (p.seed ?? null)) onUpdate({ seed: next })
  }
  const commitScore = () => {
    const next = score === "" ? null : score
    if (next !== (p.score ?? null)) onUpdate({ score: next })
  }

  const dim = p.status !== "active"
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-line py-1 last:border-b-0">
      {!isLb && (
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(e.target.value === "" ? "" : +e.target.value)}
          onBlur={commitSeed}
          onKeyDown={(e) => e.key === "Enter" && commitSeed()}
          className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[11px]"
          title="Seed"
        />
      )}
      <span className={cn("flex-1 truncate font-body text-[12.5px]", dim && "text-txt-dim line-through")}>
        {p.name}{p.flag ? ` ${p.flag}` : ""}
        {p.checkedIn && <span className="ml-1.5 font-mono text-[10px] text-ok" title="Check-in hecho">✓</span>}
      </span>
      {isLb ? (
        <>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value === "" ? "" : +e.target.value)}
            onBlur={commitScore}
            onKeyDown={(e) => e.key === "Enter" && commitScore()}
            className="w-20 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[11px]"
            title="Score"
          />
          <button
            type="button"
            onClick={() => onUpdate({ verified: !p.verified })}
            className={cn(
              "border border-solid px-1.5 py-0.5 font-mono text-[10px] transition-colors",
              p.verified ? "border-ok text-ok" : "border-line text-txt-dim hover:text-txt",
            )}
            title="Verificado"
          >
            {p.verified ? "✓ verif." : "sin verif."}
          </button>
        </>
      ) : (
        <Select
          value={p.status}
          options={PARTICIPANT_STATUS}
          onChange={(v) => onUpdate({ status: v })}
          className="w-auto"
          ariaLabel="Estado"
        />
      )}
      <button type="button" onClick={onRemove} className="text-txt-dim transition-colors hover:text-bad">✕</button>
    </div>
  )
}

function ReportPanel({
  tid,
  bestOf,
  matches,
  onReported,
}: {
  tid: number
  bestOf: number
  matches: TnMatchApi[]
  onReported: () => void
}) {
  // Scores start blank so a stray click can never record a phantom result — the
  // admin must enter a real score (or use a walkover) before OK enables.
  const [scores, setScores] = useState<Record<number, { a: string; b: string }>>({})
  const [amendId, setAmendId] = useState<number | null>(null)

  const send = async (
    m: TnMatchApi,
    body: {
      topScore: number
      botScore: number
      winnerParticipantId?: number
      amend?: boolean
      forfeit?: boolean
    },
  ) => {
    const r = await TournamentsService.report(tid, m.id, body)
    if (r.error) toast.error(r.error)
    else { setAmendId(null); onReported() }
  }

  const report = async (m: TnMatchApi, amend = false) => {
    const s = scores[m.id] ?? { a: "", b: "" }
    if (s.a === "" || s.b === "") return toast.error("Introduce el resultado")
    const a = +s.a
    const b = +s.b
    const winnerParticipantId = a === b ? undefined : a > b ? Number(m.top!.id) : Number(m.bot!.id)
    await send(m, { topScore: a, botScore: b, winnerParticipantId, amend })
  }

  const forfeit = async (m: TnMatchApi, winnerSide: "top" | "bot") => {
    const winnerParticipantId = Number((winnerSide === "top" ? m.top : m.bot)!.id)
    await send(m, { topScore: 0, botScore: 0, winnerParticipantId, forfeit: true })
  }

  // Elimination brackets are reported round by round: a semifinal can't be
  // entered until every quarterfinal is in. The earliest round of each such
  // bracket that still has an open match is the only reportable one; later
  // rounds wait. League/group/swiss aren't gated (order-free / engine-gated).
  const ELIM = ["winners", "losers", "grand"]
  const currentRound: Record<string, number> = {}
  const maxRound: Record<string, number> = {}
  for (const b of ELIM) {
    const inB = matches.filter((m) => m.bracket === b)
    if (!inB.length) continue
    maxRound[b] = Math.max(...inB.map((m) => m.roundNumber))
    const open = inB.filter((m) => m.status !== "completed" && m.status !== "bye")
    currentRound[b] = open.length ? Math.min(...open.map((m) => m.roundNumber)) : Infinity
  }
  const isLocked = (m: TnMatchApi) =>
    ELIM.includes(m.bracket) && m.roundNumber > (currentRound[m.bracket] ?? Infinity)

  const ready = matches.filter((m) => m.status === "ready" && m.top && m.bot)
  const reportable = ready.filter((m) => !isLocked(m))
  const waiting = ready.filter((m) => isLocked(m))
  // Resolved matches with two named sides can be corrected (the API guards
  // whether it is still safe to amend).
  const resolved = matches.filter((m) => m.status === "completed" && m.top && m.bot)

  const roundLabel = (m: TnMatchApi): string => {
    if (m.bracket === "grand") return "Gran final"
    if (m.bracket === "winners") {
      const fromEnd = (maxRound["winners"] ?? m.roundNumber) - m.roundNumber
      return ["Final", "Semifinales", "Cuartos", "Octavos"][fromEnd] ?? `Ronda ${m.roundNumber}`
    }
    if (m.bracket === "losers") return `Perdedores · ronda ${m.roundNumber}`
    if (m.bracket === "swiss") return `Ronda ${m.roundNumber}`
    return `Jornada ${m.roundNumber}`
  }

  // Group reportable matches by round (bracket precedence, then round order).
  const groups = new Map<string, { label: string; items: TnMatchApi[] }>()
  for (const m of reportable) {
    const key = `${m.bracket}#${m.roundNumber}`
    if (!groups.has(key)) groups.set(key, { label: roundLabel(m), items: [] })
    groups.get(key)!.items.push(m)
  }
  const bracketRank = (b: string) =>
    ["winners", "group", "league", "swiss", "losers", "grand"].indexOf(b)
  const orderedGroups = [...groups.entries()].sort(([ka], [kb]) => {
    const [ba, ra] = ka.split("#")
    const [bb, rb] = kb.split("#")
    return bracketRank(ba) - bracketRank(bb) || Number(ra) - Number(rb)
  })

  const setScore = (id: number, patch: Partial<{ a: string; b: string }>) =>
    setScores((cur) => {
      const base = cur[id] ?? { a: "", b: "" }
      return { ...cur, [id]: { ...base, ...patch } }
    })

  if (matches.length === 0) return null
  return (
    <Panel title={`Reportar resultados (${reportable.length} listos)`}>
      {reportable.length === 0 ? (
        <p className="py-2 font-mono text-[12px] text-txt-dim">
          {waiting.length > 0
            ? "Completa la ronda actual para desbloquear la siguiente."
            : "No hay partidas listas para reportar."}
        </p>
      ) : (
        <div className="grid gap-3">
          {orderedGroups.map(([key, g]) => (
            <div key={key} className="grid gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-txt-dim">
                  {g.label} · {g.items.length}
                </span>
                <RoundScheduler tid={tid} items={g.items} onScheduled={onReported} />
              </div>
              {g.items.map((m) => {
                const s = scores[m.id] ?? { a: "", b: "" }
                const filled = s.a !== "" && s.b !== ""
                return (
                  <div key={m.id} className="flex flex-wrap items-center gap-2 border border-solid border-line bg-base px-2 py-1.5">
                    <span className="min-w-[80px] flex-1 truncate text-right font-body text-[12px]">{m.top?.name}</span>
                    <input type="number" min={0} value={s.a} onChange={(e) => setScore(m.id, { a: e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" placeholder="–" />
                    <span className="font-mono text-[11px] text-txt-dim">–</span>
                    <input type="number" min={0} value={s.b} onChange={(e) => setScore(m.id, { b: e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" placeholder="–" />
                    <span className="min-w-[80px] flex-1 truncate font-body text-[12px]">{m.bot?.name}</span>
                    <Button size="sm" disabled={!filled} onClick={() => report(m)}>OK</Button>
                    <button type="button" onClick={() => forfeit(m, "top")} className="border border-solid border-line px-1.5 py-0.5 font-mono text-[9px] uppercase text-txt-dim transition-colors hover:border-line-2 hover:text-txt" title={`Walkover a favor de ${m.top?.name}`}>W.O. ↑</button>
                    <button type="button" onClick={() => forfeit(m, "bot")} className="border border-solid border-line px-1.5 py-0.5 font-mono text-[9px] uppercase text-txt-dim transition-colors hover:border-line-2 hover:text-txt" title={`Walkover a favor de ${m.bot?.name}`}>W.O. ↓</button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
      {waiting.length > 0 && (
        <p className="mt-3 border-t border-dashed border-line pt-2 font-mono text-[10px] text-txt-dim">
          🔒 {waiting.length} partida{waiting.length === 1 ? "" : "s"} en rondas posteriores — se desbloquean al cerrar la ronda actual.
        </p>
      )}

      {(() => {
        const disputed = matches.filter((m) => m.proposalState === "disputed")
        if (!disputed.length) return null
        return (
          <div className="mt-3 border border-solid border-bad bg-bad-soft px-3 py-2 font-mono text-[11px] text-bad">
            ⚠ {disputed.length} partida{disputed.length === 1 ? "" : "s"} en disputa — revisa el chat de mesa y resuelve con el reporte manual.
          </div>
        )
      })()}

      {resolved.length > 0 && (
        <details className="mt-3 border-t border-dashed border-line pt-2">
          <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-txt-dim">
            Corregir resultados ({resolved.length})
          </summary>
          <div className="mt-2 grid gap-1.5">
            {resolved.map((m) => {
              const editing = amendId === m.id
              const s = scores[m.id] ?? { a: "", b: "" }
              const filled = s.a !== "" && s.b !== ""
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-2 border border-solid border-line bg-base px-2 py-1.5">
                  <span className="min-w-[80px] flex-1 truncate text-right font-body text-[12px]">{m.top?.name}</span>
                  {editing ? (
                    <>
                      <input type="number" min={0} value={s.a} onChange={(e) => setScore(m.id, { a: e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" />
                      <span className="font-mono text-[11px] text-txt-dim">–</span>
                      <input type="number" min={0} value={s.b} onChange={(e) => setScore(m.id, { b: e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" />
                    </>
                  ) : (
                    <span className="font-mono text-[12px] text-txt-muted">{m.g1 ?? 0}–{m.g2 ?? 0}</span>
                  )}
                  <span className="min-w-[80px] flex-1 truncate font-body text-[12px]">{m.bot?.name}</span>
                  {editing ? (
                    <>
                      <Button size="sm" disabled={!filled} onClick={() => report(m, true)}>Guardar</Button>
                      <button type="button" onClick={() => setAmendId(null)} className="font-mono text-[10px] text-txt-dim hover:text-txt">cancelar</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => { setAmendId(m.id); setScore(m.id, { a: String(m.g1 ?? 0), b: String(m.g2 ?? 0) }) }} className="font-mono text-[10px] text-accent transition-opacity hover:opacity-70">corregir</button>
                  )}
                </div>
              )
            })}
          </div>
        </details>
      )}
    </Panel>
  )
}

// ── phase authoring (create form) ────────────────────────────────────────────
function PhasesEditor({
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
function PhasesManager({
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
function RoundScheduler({
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

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="grid gap-0.5">
      <h2 className="font-display text-[20px] font-bold uppercase not-italic tracking-[0.02em]">{title}</h2>
      {sub && <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-txt-dim">{sub}</p>}
    </div>
  )
}
