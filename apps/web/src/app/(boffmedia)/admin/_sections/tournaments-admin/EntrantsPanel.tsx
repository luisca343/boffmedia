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

interface PickUser {
  id: number
  username: string
  profilePicture?: string | null
}

export function EntrantsPanel({
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
