"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Avatar, Button, Icon, IconButton, Input, Select, Table, toast, type TableColumn } from "@boffmedia/ui"
import { AvMetric, AvMetrics, AvPanel, AvPill } from "../../_components/ui/av-kit"
import { UsersService } from "@/services/api/boffmedia/usersService"
import {
  TournamentsService,
  type TnCompetitorApi,
  type TournamentDetailApi,
} from "@/services/api/boffmedia/tournamentsService"
import { PARTICIPANT_STATUS } from "./constants"
import { TeamsheetViewButton } from "@/app/(boffmedia)/torneos/_components/TeamsheetEditor"
import { fieldStats, isPreStart } from "./lifecycle"

interface PickUser {
  id: number
  username: string
  profilePicture?: string | null
}

/**
 * The entrant list as a working table: every control on the kit's `sm` scale,
 * state as pills in their own column, actions clustered at the end.
 */
export function EntrantsPanel({
  detail,
  onChange,
}: {
  detail: TournamentDetailApi
  onChange: () => void
}) {
  const t = useTranslations("tournaments")
  const fs = fieldStats(detail)
  const pre = isPreStart(detail)
  const isLb = detail.format === "leaderboard"
  const showEntry = !isLb && pre
  const [name, setName] = useState("")
  const [seed, setSeed] = useState<number | "">("")
  const [country, setCountry] = useState("")
  const [score, setScore] = useState<number | "">("")

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
    if (!name.trim()) return toast.error(t("nameRequired"))
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
  // Readmit rather than flipping the status Select back to `active`: the
  // endpoint refuses once a bracket exists, which hand-editing silently would not.
  const readmit = async (pid: string) => {
    const r = await TournamentsService.readmit(detail.id, Number(pid))
    if (r.error) toast.error(r.error); else { toast.success(t("readmitted")); onChange() }
  }

  const columns: TableColumn[] = [
    ...(!isLb ? [{ key: "seed", label: t("colSeed"), width: "64px", align: "center" as const }] : []),
    { key: "who", label: t("colParticipant") },
    ...(showEntry ? [{ key: "entry", label: t("colEntry") }] : []),
    ...(isLb
      ? [
          { key: "score", label: t("score"), width: "112px", align: "right" as const },
          { key: "verified", label: t("colVerified"), width: "150px" },
        ]
      : [{ key: "status", label: t("colStatus"), width: "176px" }]),
    { key: "actions", label: t("colActions"), width: "120px", align: "right" as const, srOnly: true },
  ]

  const rows = detail.participants.map((p) => {
    const out = p.status !== "active"
    const gaps = p.entryGaps ?? []
    const hasSheet = (p.teamsheet?.length ?? 0) > 0
    return {
      id: p.id,
      seed: <NumberCell value={p.seed} onCommit={(v) => updateP(p.id, { seed: v })} label={t("seed")} className="w-12 text-center" />,
      who: (
        <span className={cn("flex items-center gap-2", out && "opacity-60")}>
          <Avatar size="sm" src={p.avatar} alt="">{p.name.slice(0, 1)}</Avatar>
          <span className={cn("truncate font-body font-semibold text-txt", out && "line-through")}>{p.name}</span>
          {p.flag && <span>{p.flag}</span>}
        </span>
      ),
      entry: (
        <span className="flex flex-wrap items-center gap-1">
          {gaps.includes("check-in")
            ? <AvPill tone="amber">{t("gapCheckIn")}</AvPill>
            : <AvPill tone="green" icon="check">{t("checkIn")}</AvPill>}
          {detail.teamsheetRequired && (
            gaps.includes("teamsheet")
              ? <AvPill tone="amber">{t("gapTeamsheet")}</AvPill>
              : <AvPill tone="green" icon="check">{t("entryTeam")}</AvPill>
          )}
        </span>
      ),
      score: <NumberCell value={p.score} onCommit={(v) => updateP(p.id, { score: v })} label={t("score")} className="w-24 text-right" />,
      verified: (
        <Button
          size="sm"
          variant={p.verified ? "pri" : "default"}
          icon={p.verified ? "check" : "minus"}
          onClick={() => updateP(p.id, { verified: !p.verified })}
        >
          {p.verified ? t("verified") : t("notVerified")}
        </Button>
      ),
      status: (
        <Select
          size="sm"
          value={p.status}
          options={PARTICIPANT_STATUS.map((s) => ({ value: s.value, label: t(s.labelKey) }))}
          onChange={(v) => updateP(p.id, { status: v })}
          ariaLabel={t("status")}
        />
      ),
      actions: (
        <span className="inline-flex items-center justify-end gap-1">
          {hasSheet && <TeamsheetViewButton sheet={p.teamsheet} name={p.name} compact />}
          {p.status === "dropped" && pre && (
            <Button size="sm" icon="refresh" onClick={() => readmit(p.id)}>{t("readmit")}</Button>
          )}
          <IconButton size="sm" variant="ghost" name="x" label={t("remove")} onClick={() => remove(p.id)} className="hover:text-bad" />
        </span>
      ),
    }
  })

  return (
    <div>
      {/* The same numbers the overview shows, so the list and the summary can
          never disagree about who is in. */}
      {showEntry && (
        <AvMetrics className="mb-[18px] [grid-template-columns:repeat(auto-fit,minmax(110px,1fr))]">
          <AvMetric label={t("participants")} value={fs.registered} />
          <AvMetric label={t("entered")} value={`${fs.entered}/${fs.active}`} tone={fs.active > 0 && fs.entered === fs.active ? "pos" : undefined} />
          <AvMetric label={t("checkIn")} value={fs.checkedIn} />
          {detail.teamsheetRequired && <AvMetric label={t("noTeam")} value={fs.missingTeamsheet} tone={fs.missingTeamsheet > 0 ? "neg" : undefined} />}
          {fs.dropped > 0 && <AvMetric label={t("constants.participantDropped")} value={fs.dropped} tone="neg" />}
        </AvMetrics>
      )}

      <AvPanel title={t("participants")} icon="users" aside={<AvPill>{detail.participants.length}</AvPill>}>
        {/* Add toolbar: a registered user by search, or a guest by hand. */}
        <div className="mb-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          {!isLb ? (
            <div className="relative">
              <Icon name="search" size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-dim" />
              <Input
                size="sm"
                value={userQuery}
                onFocus={ensureUsers}
                onChange={(e) => { ensureUsers(); setUserQuery(e.target.value) }}
                placeholder={t("searchByUsername")}
                aria-label={t("addRegisteredUser")}
                className="pl-8"
              />
              {matches.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto border border-solid border-line-2 bg-panel shadow-lg">
                  {matches.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => addUser(u)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-panel-2"
                    >
                      <Avatar size="sm" src={u.profilePicture} alt="">{u.username.slice(0, 1)}</Avatar>
                      <span className="flex-1 truncate font-body text-[12.5px]">{u.username}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-accent">+ {t("add")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : <span />}

          <div className="flex items-center gap-1.5">
            <Input
              size="sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isLb ? t("guestEntry") : t("guestName")}
              aria-label={isLb ? t("guestEntry") : t("guestName")}
              onKeyDown={(e) => e.key === "Enter" && addGuest()}
              className="w-44"
            />
            {!isLb && (
              <Input
                size="sm"
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value === "" ? "" : +e.target.value)}
                placeholder="#"
                aria-label={t("seed")}
                className="w-14 text-center font-mono"
              />
            )}
            <Input
              size="sm"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="ES"
              maxLength={2}
              aria-label={t("country")}
              className="w-14 text-center font-mono uppercase"
            />
            {isLb && (
              <Input
                size="sm"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value === "" ? "" : +e.target.value)}
                placeholder={t("score")}
                aria-label={t("score")}
                className="w-20 text-right font-mono"
              />
            )}
            <Button size="sm" icon="plus" onClick={addGuest}>{t("add")}</Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="m-0 py-4 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim">
            {t("noEntrants")}
          </p>
        ) : (
          <Table dense columns={columns} rows={rows} rowKey={(r) => r.id as string} />
        )}
      </AvPanel>
    </div>
  )
}

/** An inline number that commits on blur or Enter — seed, score. */
function NumberCell({
  value,
  onCommit,
  label,
  className,
}: {
  value: number | null
  onCommit: (next: number | null) => void
  label: string
  className?: string
}) {
  const [v, setV] = useState<number | "">(value ?? "")
  const commit = () => {
    const next = v === "" ? null : v
    if (next !== (value ?? null)) onCommit(next)
  }
  return (
    <Input
      size="sm"
      type="number"
      value={v}
      onChange={(e) => setV(e.target.value === "" ? "" : +e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      placeholder="—"
      aria-label={label}
      className={cn("font-mono", className)}
    />
  )
}
