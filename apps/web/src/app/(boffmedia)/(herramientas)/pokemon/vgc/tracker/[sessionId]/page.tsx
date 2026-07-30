"use client"

import { use, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  DkApp,
  DkBar,
  DkBody,
  DkChip,
  DkSpacer,
  DkStat,
  DkSub,
  DkSubNote,
  DkTitle,
  DkBack,
  DkEmpty,
} from "@/components/boffmedia/ui/tools/datakit"
import { DkSeg } from "@/components/boffmedia/ui/tools/datakit"
import { Button, Modal, Field, Input, Spinner } from "@boffmedia/ui"
import { useMatches, usePresets, useSeries, useSessions, usePreset } from "@/features/vgc-tracker/hooks/useVgcDb"
import { emptySlots, slotsForGame, slotsFromPreset } from "@/features/vgc-tracker/types"
import { parseMatchCsv } from "@/features/vgc-tracker/utils/importCsv"
import { vgcDb } from "@/lib/db/vgc-db"
import { useTrackerSync } from "@/features/vgc-tracker/context/TrackerSyncContext"
import type { Match, Series, SeriesGame } from "@/features/vgc-tracker/types"
import { TrStats } from "./_components/TrStats"
import { TrMatchRow, TrSeriesRow } from "./_components/TrRows"
import { SessionNotesEditor } from "./_components/SessionNotesEditor"
import { TrSprite } from "../_components/ui/tr-ui"
import { ExportImportDialog } from "../_components/ExportImportDialog"

interface Props {
  params: Promise<{ sessionId: string }>
}

export default function SessionPage({ params }: Props) {
  const t = useTranslations("vgc.tracker")
  const tStats = useTranslations("vgc.tracker.sessionStats")
  const { sessionId } = use(params)
  const router = useRouter()
  const { sessions, update: updateSession } = useSessions()
  const session = sessions.find((s) => s.id === sessionId)
  const { matches, loading, create: createMatch, refresh: refreshMatches } = useMatches(sessionId)
  const { seriesList, loading: seriesLoading, create: createSeries } = useSeries(sessionId)
  const { pushChange } = useTrackerSync()
  const { presets } = usePresets()
  const preset = usePreset(session?.activePresetId ?? null)
  const isTournament = session?.type === "tournament"
  const sessionPresets = presets.filter((p) => p.regulationId === session?.regulationId)

  const [tab, setTab] = useState<"matches" | "stats">("matches")
  const [showPresetPicker, setShowPresetPicker] = useState(false)
  const [showExportImport, setShowExportImport] = useState(false)
  const [roundFilter, setRoundFilter] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importConfig, setImportConfig] = useState<{ file: File } | null>(null)
  const [importStartDate, setImportStartDate] = useState(() => {
    const d = new Date()
    d.setSeconds(0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [importMins, setImportMins] = useState(10)

  const wins = matches.filter((m) => m.result === "win").length
  const losses = matches.filter((m) => m.result === "loss").length
  const draws = matches.filter((m) => m.result === "draw").length
  const latestElo = [...matches].sort((a, b) => b.createdAt - a.createdAt).find((m) => m.eloAfter !== undefined)?.eloAfter

  const tourStats = useMemo(() => {
    const seriesWins = seriesList.filter((s) => s.seriesResult === "win").length
    const seriesLosses = seriesList.filter((s) => s.seriesResult === "loss").length
    const games = seriesList.flatMap((s) => s.games)
    return { seriesWins, seriesLosses, gameWins: games.filter((g) => g.result === "win").length, gameLosses: games.filter((g) => g.result === "loss").length }
  }, [seriesList])

  const eloDeltas = useMemo(() => {
    const asc = [...matches].sort((a, b) => a.createdAt - b.createdAt)
    const map = new Map<string, number>()
    asc.forEach((m, i) => {
      const prev = i === 0 ? session?.startElo : asc[i - 1].eloAfter
      if (m.eloAfter !== undefined && prev !== undefined) map.set(m.id, m.eloAfter - prev)
    })
    return map
  }, [matches, session?.startElo])

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session) return
    setImportConfig({ file })
    e.target.value = ""
  }

  const confirmImport = async () => {
    if (!importConfig || !session) return
    setImporting(true)
    try {
      const text = await importConfig.file.text()
      const newMatches = parseMatchCsv(text, sessionId, session.format, new Date(importStartDate), importMins)
      if (newMatches.length > 0) {
        await vgcDb.matches.bulkPut(newMatches)
        for (const m of newMatches) pushChange("matches", m.id, m)
        await refreshMatches()
      }
    } finally {
      setImporting(false)
      setImportConfig(null)
    }
  }

  const handleNewMatch = async () => {
    if (!session) return
    const match: Match = {
      id: crypto.randomUUID(),
      sessionId,
      format: session.format,
      createdAt: Date.now(),
      myTeam: { presetId: preset?.id, slots: preset ? slotsFromPreset(preset) : emptySlots() },
      opponentTeam: { slots: emptySlots() },
      notes: [],
    }
    await createMatch(match)
    router.push(`/pokemon/vgc/tracker/${sessionId}/${match.id}`)
  }

  const handleNewSeries = async () => {
    if (!session) return
    const myTeamSlots = preset ? slotsFromPreset(preset) : emptySlots()
    const firstGame: SeriesGame = {
      id: crypto.randomUUID(),
      gameNumber: 1,
      mySlots: slotsForGame(myTeamSlots),
      opponentSlots: emptySlots(),
      notes: [],
    }
    const series: Series = {
      id: crypto.randomUUID(),
      sessionId,
      createdAt: Date.now(),
      myTeam: { presetId: preset?.id, slots: myTeamSlots },
      opponentTeam: { slots: emptySlots() },
      games: [firstGame],
      notes: [],
    }
    await createSeries(series)
    router.push(`/pokemon/vgc/tracker/${sessionId}/series/${series.id}`)
  }

  const rounds = useMemo(
    () => [...new Set(seriesList.flatMap((s) => (s.roundNumber != null ? [s.roundNumber] : [])))].sort((a, b) => a - b),
    [seriesList],
  )
  const shownSeries = roundFilter != null ? seriesList.filter((s) => s.roundNumber === roundFilter) : seriesList

  const showNotes = isTournament || tab === "matches"

  return (
    <DkApp>
      <DkBar>
        <DkBack onClick={() => router.push("/pokemon/vgc/tracker")} label={t("nav.backToSessions")} />
        <DkTitle
          icon={isTournament ? "trophy" : "sword"}
          label={session?.label ?? "…"}
          sub={
            isTournament && session?.tournamentName
              ? `${session.tournamentName} · ${session.regulationId}`
              : session
                ? `${session.regulationId} · ${session.format}`
                : undefined
          }
        />
        <DkSpacer />
        {preset && <DkChip icon="layers">{preset.name}</DkChip>}
        <Button size="sm" icon="database" onClick={() => setShowExportImport(true)}>
          {t("buttons.export")}
        </Button>
        {!isTournament && sessionPresets.length > 1 && (
          <Button size="sm" icon="layers" onClick={() => setShowPresetPicker(true)}>
            {preset?.name ?? t("buttons.changePreset")}
          </Button>
        )}
        {!isTournament && (
          <>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
            <Button size="sm" icon="inbox" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? t("buttons.importing") : t("buttons.importCsv")}
            </Button>
          </>
        )}
        <Button variant="pri" size="sm" icon="plus" onClick={isTournament ? handleNewSeries : handleNewMatch}>
          {isTournament ? t("buttons.newSeries") : t("buttons.newMatch")}
        </Button>
      </DkBar>

      {!isTournament && (
        <DkSub>
          <DkSeg
            size="sm"
            value={tab}
            onChange={(v) => setTab(v as "matches" | "stats")}
            ariaLabel={tStats("tabs.aria")}
            options={[
              { value: "matches", label: tStats("tabs.matches") },
              { value: "stats", label: tStats("tabs.stats") },
            ]}
          />
          <DkSubNote>{t("sessionSub.record", { played: wins + losses + draws, wins, losses })}</DkSubNote>
        </DkSub>
      )}

      <DkBody>
        <div className="grid gap-[14px]">
          {isTournament ? (
            <div className="grid grid-cols-3 gap-2">
              <DkStat value={tourStats.seriesWins} label={t("tournament.seriesWins")} tone="pos" />
              <DkStat value={tourStats.seriesLosses} label={t("tournament.seriesLosses")} tone="neg" />
              <DkStat value={`${tourStats.gameWins}–${tourStats.gameLosses}`} label={t("tournament.gameRecord")} />
            </div>
          ) : (
            tab === "matches" && (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <DkStat value={wins} label={t("stats.wins")} tone="pos" />
                <DkStat value={draws} label={t("stats.draws")} />
                <DkStat value={losses} label={t("stats.losses")} tone="neg" />
                <DkStat
                  value={latestElo ?? session?.startElo ?? "—"}
                  label={t("stats.elo")}
                  tone={latestElo != null && session?.startElo != null ? (latestElo >= session.startElo ? "pos" : "neg") : "neutral"}
                />
              </div>
            )
          )}

          {showNotes && session && (
            <SessionNotesEditor notes={session.sessionNotes} onSave={(notes) => updateSession(sessionId, { sessionNotes: notes })} />
          )}

          {isTournament ? (
            seriesLoading ? (
              <Loading />
            ) : seriesList.length === 0 ? (
              <DkEmpty icon="trophy" title={t("empty.noSeriesTitle")} lead={t("tournament.noSeries")} />
            ) : (
              <div className="grid gap-[7px]">
                {rounds.length > 1 && (
                  <div className="mb-[3px] flex flex-wrap gap-[5px]" role="tablist" aria-label={t("tournament.filterByRound")}>
                    <RoundBtn on={roundFilter == null} onClick={() => setRoundFilter(null)}>
                      {t("tournament.allRounds")}
                    </RoundBtn>
                    {rounds.map((rn) => (
                      <RoundBtn key={rn} on={roundFilter === rn} onClick={() => setRoundFilter(rn)}>
                        R{rn}
                      </RoundBtn>
                    ))}
                  </div>
                )}
                {shownSeries.map((s) => (
                  <TrSeriesRow key={s.id} series={s} number={seriesList.length - seriesList.indexOf(s)} sessionId={sessionId} />
                ))}
              </div>
            )
          ) : tab === "stats" ? (
            <TrStats sessionId={sessionId} session={session} sessions={sessions} />
          ) : loading ? (
            <Loading />
          ) : matches.length === 0 ? (
            <DkEmpty icon="sword" title={t("empty.noMatchesTitle")} lead={t("empty.noMatches")} />
          ) : (
            <div className="grid gap-[7px]">
              {matches.map((m, i) => (
                <TrMatchRow key={m.id} match={m} number={matches.length - i} sessionId={sessionId} eloDelta={eloDeltas.get(m.id)} />
              ))}
            </div>
          )}
        </div>
      </DkBody>

      {showPresetPicker && (
        <Modal open onClose={() => setShowPresetPicker(false)} title={t("preset.changeTitle")} size="sm">
          <div className="grid gap-2">
            {sessionPresets.map((p) => {
              const active = p.id === session?.activePresetId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    updateSession(sessionId, { activePresetId: p.id })
                    setShowPresetPicker(false)
                  }}
                  className={cn(
                    "flex items-center gap-3 border border-solid px-3 py-[10px] text-left transition-colors",
                    active ? "border-accent-line bg-accent-soft" : "border-line bg-base hover:border-line-2",
                  )}
                >
                  <span className="flex flex-none gap-px">
                    {p.slots.slice(0, 3).map((s) => (
                      <TrSprite key={s.slotIndex} name={s.speciesName} size={26} />
                    ))}
                  </span>
                  <span className="flex-1 truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">{p.name}</span>
                  {active && <span className="font-mono text-[10px] text-accent-bright">{t("preset.currentTag")}</span>}
                </button>
              )
            })}
          </div>
        </Modal>
      )}

      {showExportImport && (
        <ExportImportDialog
          sessionId={sessionId}
          sessionLabel={session?.label}
          onImportDone={() => refreshMatches()}
          onClose={() => setShowExportImport(false)}
        />
      )}

      {importConfig && (
        <Modal open onClose={() => setImportConfig(null)} title={t("modals.importCsv")} size="sm">
          <div className="grid gap-4">
            <Field label={t("labels.startDate")}>
              <Input type="datetime-local" value={importStartDate} onChange={(e) => setImportStartDate(e.target.value)} />
            </Field>
            <Field label={t("labels.minsPerGame")}>
              <Input
                type="number"
                min={1}
                max={120}
                value={importMins}
                onChange={(e) => setImportMins(Math.max(1, parseInt(e.target.value) || 10))}
              />
            </Field>
            <div className="mt-1 flex justify-end gap-2">
              <Button size="sm" onClick={() => setImportConfig(null)}>
                {t("buttons.cancel")}
              </Button>
              <Button size="sm" variant="pri" onClick={confirmImport} disabled={importing}>
                {importing ? t("buttons.importing") : t("buttons.importFile", { name: importConfig.file.name })}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DkApp>
  )
}

function Loading() {
  return (
    <div className="grid place-items-center py-16">
      <Spinner />
    </div>
  )
}

function RoundBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ clipPath: "polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)" }}
      className={cn(
        "border border-solid px-[10px] py-[6px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.06em] transition-[color,background,border-color]",
        on ? "border-accent bg-accent text-accent-ink" : "border-line-2 bg-base text-txt-muted hover:text-txt",
      )}
    >
      {children}
    </button>
  )
}
