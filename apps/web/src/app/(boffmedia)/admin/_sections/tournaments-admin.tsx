"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Panel, Field, Input, Select, Button, toast } from "@/components/boffmedia/primitives"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
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
} from "@/services/api/boffmedia/tournamentsService"

const FORMATS: TnFormat[] = ["single", "double", "groups", "roundrobin", "swiss", "leaderboard"]
const KINDS: TnKind[] = ["solo", "team", "entry"]
const PHASE_FORMATS: TnPhaseFormat[] = ["swiss", "single", "double", "roundrobin", "leaderboard"]
const ADVANCE_TYPES: TnAdvanceType[] = ["record", "top_n", "all"]

// Official Pokémon VGC regional shape: Day 1 swiss → Day 2 swiss (carry) → Top Cut.
const VGC_PRESET: TnPhaseInput[] = [
  { name: "Día 1 — Suizo", format: "swiss", rounds: 9, advanceType: "record", advanceMaxLosses: 2, tiebreakProfile: "resistance" },
  { name: "Día 2 — Suizo", format: "swiss", rounds: 5, carryStandings: true, advanceType: "record", advanceMaxLosses: 2, tiebreakProfile: "resistance" },
  { name: "Top Cut", format: "single", tiebreakProfile: "resistance" },
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
  const generate = async () => {
    const r = await TournamentsService.generate(t.id, { seeding })
    if (r.error) toast.error(r.error); else { toast.success("Generado"); refreshAll() }
  }
  const advance = async () => {
    const r = await TournamentsService.advance(t.id)
    if (r.error) toast.error(r.error); else { toast.success("Fase avanzada"); refreshAll() }
  }
  const remove = async () => {
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

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <Button size="sm" icon="back" onClick={onBack}>Torneos</Button>
        <SectionHead title={t.name} sub={`${t.format} · ${t.status}`} />
      </div>

      <Panel title="Ciclo de vida" aside={<TnFormatBadge format={t.format} size="sm" />}>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setStatus("registration")}>Abrir inscripción</Button>
          <Button size="sm" variant="pri" icon="bolt" onClick={generate}>{genLabel}</Button>
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
          <Button size="sm" onClick={() => setStatus("completed")}>Finalizar</Button>
          <Button size="sm" onClick={remove}>Eliminar</Button>
        </div>
        {t.champion && <p className="mt-2 font-mono text-[12px] text-accent-bright">🏆 Campeón: {t.champion.name}</p>}
      </Panel>

      {multiPhase && <PhasesPanel phases={t.phases} />}

      <EntrantsPanel detail={t} onChange={refreshAll} />
      <ReportPanel tid={t.id} bestOf={livePhase?.bestOf ?? t.bestOf} matches={matches} onReported={refreshAll} />
    </div>
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

  return (
    <Panel title={`Participantes (${detail.participants.length})`}>
      {/* Add a real registered user (real name + avatar). */}
      {!isLb && (
        <div className="relative mb-3">
          <Field label="Añadir usuario registrado">
            <Input
              value={userQuery}
              onFocus={ensureUsers}
              onChange={(e) => { ensureUsers(); setUserQuery(e.target.value) }}
              placeholder="Buscar por nombre de usuario…"
            />
          </Field>
          {matches.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-w-md border border-solid border-line-2 bg-panel shadow-lg">
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
          <div key={p.id} className="flex items-center gap-2 border-b border-dashed border-line py-1 last:border-b-0">
            {p.seed != null && <span className="w-6 font-mono text-[10px] text-txt-dim">#{p.seed}</span>}
            <span className="flex-1 truncate font-body text-[12.5px]">{p.name}{p.flag ? ` ${p.flag}` : ""}</span>
            <button type="button" onClick={() => remove(p.id)} className="text-txt-dim transition-colors hover:text-bad">✕</button>
          </div>
        ))}
      </div>
    </Panel>
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
  const [scores, setScores] = useState<Record<number, { a: number; b: number }>>({})
  // A valid decisive best-of-N result: winner takes the majority, loser one less
  // (1-0 for BO1, 2-1 for BO3, 3-2 for BO5) — matches the API's best-of guard.
  const majority = Math.max(1, Math.ceil(bestOf / 2))
  const def = { a: majority, b: Math.max(0, majority - 1) }

  const report = async (m: TnMatchApi) => {
    const s = scores[m.id] ?? def
    const winnerParticipantId = s.a === s.b ? undefined : s.a > s.b ? Number(m.top!.id) : Number(m.bot!.id)
    const r = await TournamentsService.report(tid, m.id, { topScore: s.a, botScore: s.b, winnerParticipantId })
    if (r.error) toast.error(r.error); else onReported()
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
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-txt-dim">
                {g.label} · {g.items.length}
              </span>
              {g.items.map((m) => {
                const s = scores[m.id] ?? def
                const set = (patch: Partial<{ a: number; b: number }>) =>
                  setScores((cur) => ({ ...cur, [m.id]: { ...s, ...patch } }))
                return (
                  <div key={m.id} className="flex items-center gap-2 border border-solid border-line bg-base px-2 py-1.5">
                    <span className="flex-1 truncate text-right font-body text-[12px]">{m.top?.name}</span>
                    <input type="number" min={0} value={s.a} onChange={(e) => set({ a: +e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" />
                    <span className="font-mono text-[11px] text-txt-dim">–</span>
                    <input type="number" min={0} value={s.b} onChange={(e) => set({ b: +e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" />
                    <span className="flex-1 truncate font-body text-[12px]">{m.bot?.name}</span>
                    <Button size="sm" onClick={() => report(m)}>OK</Button>
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
            const advType = p.advanceType ?? "record"
            return (
              <div key={i} className="border border-solid border-line bg-base p-2">
                <div className="mb-2 flex items-center gap-2">
                  <span className="w-12 font-mono text-[10px] text-txt-dim">Fase {i + 1}</span>
                  <Input value={p.name} onChange={(e) => update(i, { name: e.target.value })} className="flex-1" />
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-txt-dim transition-colors hover:text-txt disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={isLast} className="px-1 text-txt-dim transition-colors hover:text-txt disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => remove(i)} className="px-1 text-txt-dim transition-colors hover:text-bad">✕</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Formato">
                    <Select value={p.format} options={[...PHASE_FORMATS]} onChange={(v) => update(i, { format: v as TnPhaseFormat })} />
                  </Field>
                  {p.format === "swiss" && (
                    <Field label="Rondas">
                      <Input type="number" min={1} value={p.rounds ?? ""} onChange={(e) => update(i, { rounds: e.target.value === "" ? undefined : Math.max(1, +e.target.value) })} />
                    </Field>
                  )}
                  {i > 0 && (
                    <Field label="Registro previo">
                      <Select
                        value={p.carryStandings ? "yes" : "no"}
                        options={[{ value: "no", label: "Reiniciar" }, { value: "yes", label: "Arrastrar (carry)" }]}
                        onChange={(v) => update(i, { carryStandings: v === "yes" })}
                      />
                    </Field>
                  )}
                  <Field label="Desempate">
                    <Select
                      value={p.tiebreakProfile ?? "points"}
                      options={[{ value: "points", label: "Puntos" }, { value: "resistance", label: "Resistencia" }]}
                      onChange={(v) => update(i, { tiebreakProfile: v as "points" | "resistance" })}
                    />
                  </Field>
                  {!isLast && (
                    <>
                      <Field label="Avance">
                        <Select value={advType} options={[...ADVANCE_TYPES]} onChange={(v) => update(i, { advanceType: v as TnAdvanceType })} />
                      </Field>
                      {advType === "record" && (
                        <Field label="Máx. derrotas">
                          <Input type="number" min={0} value={p.advanceMaxLosses ?? 2} onChange={(e) => update(i, { advanceMaxLosses: Math.max(0, +e.target.value) })} />
                        </Field>
                      )}
                      {advType === "top_n" && (
                        <Field label="Top N">
                          <Input type="number" min={1} value={p.advanceCount ?? 8} onChange={(e) => update(i, { advanceCount: Math.max(1, +e.target.value) })} />
                        </Field>
                      )}
                    </>
                  )}
                </div>
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

// ── phase stepper (manage view) ──────────────────────────────────────────────
function PhasesPanel({ phases }: { phases: TnPhaseApi[] }) {
  return (
    <Panel title="Fases">
      <div className="flex flex-wrap items-center gap-2">
        {phases.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className={cn("min-w-[148px] border border-solid bg-base px-3 py-2", PHASE_STATUS_TONE[p.status] ?? "border-line")}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-body text-[12.5px] font-semibold">{p.name}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.08em]">{p.status}</span>
              </div>
              <div className="mt-1 font-mono text-[10px] text-txt-dim">
                {p.format}{p.rounds ? ` · ${p.rounds}r` : ""} · {p.entrantCount}👤
                {p.qualifiedCount != null ? ` · clasifican ${p.qualifiedCount}` : ""}
              </div>
              {p.advance && (
                <div className="mt-0.5 font-mono text-[9px] text-txt-dim">
                  {p.advance.type === "record"
                    ? `≤${p.advance.maxLosses ?? 0} derrotas`
                    : p.advance.type === "top_n"
                      ? `top ${p.advance.count ?? ""}`
                      : "todos avanzan"}
                </div>
              )}
            </div>
            {i < phases.length - 1 && <span className="font-mono text-txt-dim">→</span>}
          </div>
        ))}
      </div>
    </Panel>
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
