"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useVgcT } from "../../i18n";
import { cn, Modal, Field, Input, Select, Button, Icon, Popover } from "@boffmedia/ui"
import { DkSeg } from "@boffmedia/ui/datakit"
import { VgcService, ChampionsRegulation, LimitlessTournament } from "../../service"
import type { MatchFormat, Session, SessionType, TeamPreset } from "../../tracker-core/types"
import { TrSprite } from "./ui/tr-ui"

interface Props {
  presets: TeamPreset[]
  onConfirm: (session: Omit<Session, "id" | "startedAt">) => void
  onClose: () => void
}

function TeamPicker({
  presets,
  value,
  regulationId,
  onChange,
}: {
  presets: TeamPreset[]
  value: string
  regulationId: string
  onChange: (id: string) => void
}) {
  const t = useVgcT("tracker")
  const [query, setQuery] = useState("")
  const selected = presets.find((team) => team.id === value)
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      presets.filter((team) => {
        if (!normalizedQuery) return true
        return [team.name, team.regulationId, ...team.slots.map((slot) => slot.speciesName)]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      }),
    [normalizedQuery, presets],
  )
  const matchingTeams = useMemo(
    () => filtered.filter((team) => regulationId && team.regulationId === regulationId),
    [filtered, regulationId],
  )
  const otherTeams = useMemo(
    () => filtered.filter((team) => !regulationId || team.regulationId !== regulationId),
    [filtered, regulationId],
  )

  const teamMembers = (team: TeamPreset) => team.slots.slice(0, 6)

  const renderTeam = (team: TeamPreset, isMatchingRegulation: boolean, close: () => void) => {
    const members = teamMembers(team)
    const active = team.id === value
    return (
      <button
        key={team.id}
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => {
          onChange(team.id)
          close()
        }}
        className={cn(
          "grid gap-2 border border-solid px-2.5 py-2 text-left transition-colors",
          active
            ? "border-accent-line bg-accent-soft"
            : isMatchingRegulation
              ? "border-accent-line bg-accent-soft hover:bg-accent-soft"
              : "border-transparent hover:border-line hover:bg-panel-2",
        )}
      >
        <span className="flex min-w-0 items-start gap-2">
          <span className="grid min-w-0 flex-1 gap-1">
            <span className={cn("truncate font-body text-[0.75rem] font-semibold", active || isMatchingRegulation ? "text-accent-bright" : "text-txt")}>
              {team.name}
            </span>
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-txt-dim">
              {team.regulationId} · {t("labels.teamMembers", { count: members.length })}
            </span>
          </span>
          {active && <Icon name="check" size={14} className="mt-0.5 flex-none text-accent-bright" />}
        </span>
        <span className="flex flex-wrap items-end gap-x-2 gap-y-1 border-t border-solid border-line pt-1.5">
          {members.map((slot) => (
            <span key={slot.slotIndex} className="inline-flex min-w-0 items-center gap-1">
              <TrSprite name={slot.speciesName} size={23} title={slot.speciesName} />
              <span className="max-w-[5.5rem] truncate font-mono text-[0.5625rem] text-txt-dim">{slot.speciesName}</span>
            </span>
          ))}
        </span>
      </button>
    )
  }

  const trigger = (
    <div
      className={cn(
        "flex min-h-[3.75rem] w-full items-center gap-3 border border-solid border-line-2 bg-base px-3 py-2 text-left",
        "cut-tag cut-tag-edge [--cut-line:var(--line-2)] transition-[border-color,background] hover:border-accent hover:bg-panel-2",
        value && "border-accent-line",
      )}
    >
      <span className="grid min-w-0 flex-1 gap-1">
        <span className={cn("truncate font-body text-[0.8125rem] font-semibold", !selected && "text-txt-dim")}>
          {selected?.name ?? t("labels.noPreset")}
        </span>
        {selected ? (
          <span className="font-mono text-[0.59375rem] uppercase tracking-[0.08em] text-txt-dim">
            {selected.regulationId} · {t("labels.teamMembers", { count: teamMembers(selected).length })}
          </span>
        ) : (
          <span className="font-mono text-[0.59375rem] uppercase tracking-[0.08em] text-txt-dim">
            {t("labels.selectTeam")}
          </span>
        )}
      </span>
      {selected && (
        <span className="hidden shrink-0 items-center gap-px sm:inline-flex">
          {teamMembers(selected).map((slot) => (
            <TrSprite key={slot.slotIndex} name={slot.speciesName} size={22} title={slot.speciesName} />
          ))}
        </span>
      )}
      <Icon name="chevronDown" size={15} className="flex-none text-txt-dim" />
    </div>
  )

  return (
    <Popover
      trigger={trigger}
      portal
      ariaLabel={t("labels.teamPreset")}
      className="w-[min(27rem,calc(100vw-3rem))] p-2"
    >
      {({ close }) => (
        <div className="grid gap-2">
          <div className="relative">
            <Icon name="search" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-dim" />
            <Input
              autoFocus
              size="sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("labels.searchTeams")}
              aria-label={t("labels.searchTeams")}
              className="pl-8"
            />
          </div>

          <div role="listbox" aria-label={t("labels.teamPreset")} className="grid max-h-[17rem] gap-1 overflow-y-auto pr-0.5">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => {
                onChange("")
                close()
              }}
              className={cn(
                "flex items-center gap-2 border border-solid px-2.5 py-2 text-left transition-colors",
                !value ? "border-accent-line bg-accent-soft text-accent-bright" : "border-transparent text-txt-dim hover:border-line hover:bg-panel-2 hover:text-txt",
              )}
            >
              <Icon name="minus" size={14} className="flex-none" />
              <span className="font-body text-[0.75rem] font-medium">{t("labels.noPreset")}</span>
              {!value && <Icon name="check" size={13} className="ml-auto flex-none" />}
            </button>

            {matchingTeams.length > 0 && (
              <div className="flex items-center gap-2 border-b border-solid border-accent-line bg-accent-soft px-2.5 py-2 font-mono text-[0.59375rem] font-bold uppercase tracking-[0.1em] text-accent-bright">
                <Icon name="check" size={13} className="flex-none" />
                <span>{t("labels.matchingRegulation")}</span>
                <span className="ml-auto text-[0.5625rem] text-txt-dim">{regulationId}</span>
              </div>
            )}
            {matchingTeams.map((team) => renderTeam(team, true, close))}

            {otherTeams.length > 0 && (
              <div className="mt-1 flex items-center gap-2 border-b border-solid border-line px-2.5 py-2 font-mono text-[0.59375rem] font-bold uppercase tracking-[0.1em] text-txt-dim">
                <Icon name="layers" size={13} className="flex-none" />
                <span>{regulationId ? t("labels.otherRegulations") : t("labels.allTeams")}</span>
              </div>
            )}
            {otherTeams.map((team) => renderTeam(team, false, close))}

            {filtered.length === 0 && (
              <p className="m-0 px-2.5 py-4 text-center font-mono text-[0.6875rem] text-txt-dim">
                {t("labels.noTeamsMatch")}
              </p>
            )}
          </div>
        </div>
      )}
    </Popover>
  )
}

export function NewSessionDialog({ presets, onConfirm, onClose }: Props) {
  const t = useVgcT("tracker")
  const [sessionType, setSessionType] = useState<SessionType>("ladder")
  const [label, setLabel] = useState("")
  const [tournamentName, setTournamentName] = useState("")
  const [format, setFormat] = useState<MatchFormat>("BO1")
  const [regulationId, setRegulationId] = useState("")
  const [activePresetId, setActivePresetId] = useState("")
  const [startElo, setStartElo] = useState("")
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])
  const [limitlessTournaments, setLimitlessTournaments] = useState<LimitlessTournament[]>([])
  const [limitlessTournamentId, setLimitlessTournamentId] = useState<number | undefined>(undefined)
  const initializedPreset = useRef(false)

  useEffect(() => {
    setFormat(sessionType === "tournament" ? "BO3" : "BO1")
  }, [sessionType])

  useEffect(() => {
    if (!regulationId) return
    const regulationPreset = presets.find((team) => team.regulationId === regulationId)
    if (!initializedPreset.current) {
      setActivePresetId(regulationPreset?.id ?? "")
      initializedPreset.current = true
    }
  }, [presets, regulationId])

  useEffect(() => {
    VgcService.getChampionsRegulations().then((res) => {
      if (res.success && res.data) {
        setRegulations(res.data)
        setRegulationId(res.data[0]?.id ?? "")
      }
    })
  }, [])

  useEffect(() => {
    if (sessionType !== "tournament" || !regulationId) return
    setLimitlessTournaments([])
    setLimitlessTournamentId(undefined)
    VgcService.getLimitlessTournaments(regulationId).then((res) => {
      if (res.success && res.data) setLimitlessTournaments(res.data.filter((x) => x.status === "done"))
    })
  }, [sessionType, regulationId])

  const canSubmit = !!label.trim() && !!regulationId

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const parsed = parseFloat(startElo)
    onConfirm({
      type: sessionType,
      label: label.trim(),
      format,
      regulationId,
      activePresetId,
      startElo: sessionType === "ladder" && !isNaN(parsed) ? parsed : undefined,
      tournamentName: sessionType === "tournament" ? tournamentName.trim() || undefined : undefined,
      limitlessTournamentId: sessionType === "tournament" ? limitlessTournamentId : undefined,
    })
  }

  return (
    <Modal open onClose={onClose} title={t("modals.newSession")} size="lg">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <DkSeg
          value={sessionType}
          onChange={(v) => setSessionType(v as SessionType)}
          ariaLabel={t("filters.sessionType")}
          className="w-full [&>button]:flex-1 [&>button]:justify-center"
          options={[
            { value: "ladder", label: <><Icon name="trending" size={13} /> {t("sessionType.ladder")}</> },
            { value: "tournament", label: <><Icon name="trophy" size={13} /> {t("sessionType.tournament")}</> },
          ]}
        />

        {sessionType === "tournament" && (
          <>
            <Field label={t("labels.tournamentName")}>
              <Input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} placeholder={t("placeholders.tournamentName")} />
            </Field>
            <Field
              label={
                <>
                  {t("labels.limitlessTournament")} <span className="font-normal normal-case text-txt-dim">({t("labels.optional")})</span>
                </>
              }
              hint={limitlessTournaments.length === 0 && regulationId ? t("labels.noImportedTournaments") : undefined}
            >
              <Select
                value={limitlessTournamentId != null ? String(limitlessTournamentId) : ""}
                onChange={(v) => setLimitlessTournamentId(v ? Number(v) : undefined)}
                options={[
                  { value: "", label: t("labels.noTournamentLink") },
                  ...limitlessTournaments.map((x) => ({
                    value: String(x.id),
                    label: `${x.name ?? x.limitlessId}${x.date ? ` · ${x.date}` : ""}`,
                  })),
                ]}
              />
            </Field>
          </>
        )}

        <Field label={t("labels.sessionLabel")}>
          <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("placeholders.sessionLabel")} />
        </Field>

        <div className={`grid gap-3 ${sessionType === "ladder" ? "grid-cols-2" : "grid-cols-1"}`}>
          <Field label={t("labels.format")}>
            <Select value={format} onChange={(v) => setFormat(v as MatchFormat)} options={["BO1", "BO3"]} />
          </Field>
          {sessionType === "ladder" && (
            <Field label={t("labels.startingElo")}>
              <Input type="number" value={startElo} onChange={(e) => setStartElo(e.target.value)} placeholder={t("placeholders.startingElo")} />
            </Field>
          )}
        </div>

        <Field label={t("labels.regulation")}>
          <Select value={regulationId} onChange={setRegulationId} options={regulations.map((r) => ({ value: r.id, label: r.name }))} />
        </Field>

        {presets.length > 0 && (
          <Field label={t("labels.teamPreset")}>
            <TeamPicker presets={presets} regulationId={regulationId} value={activePresetId} onChange={setActivePresetId} />
          </Field>
        )}

        <div className="mt-1 flex gap-2">
          <Button type="button" size="sm" onClick={onClose} className="flex-1">
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" variant="pri" size="sm" disabled={!canSubmit} className="flex-1">
            {t("buttons.startSession")}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
