"use client"

import { useState, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ToolApp } from "@/components/boffmedia/primitives/tool-app"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { SegTabs } from "@/components/boffmedia/primitives/seg-tabs"
import { ToolSelect } from "@/components/boffmedia/primitives/tool-select"
import { VgcUsageSidebar } from "./usage-sidebar"
import { VgcPokemonDetail } from "./pokemon-detail"
import { VgcStandingsView } from "./standings-view"
import { VgcDivergenceView } from "./divergence-view"
import { fmtCount, type PokeData, type UsageEntry, type Format, type TourReg, type PlayerEntry, type DivergenceResult } from "./meta-data"

interface VgcMetaProps {
  pokeMap: Record<string, PokeData>
  formats: Record<string, Format>
  tourRegs: TourReg[]
  tournaments: Record<string, { id: string | number; name: string; date: string; players: number }[]>
  cutoffs: number[]
  cutoffLabel: (c: number) => string
  ladderUsage: (fmtId: string, month: string, cutoff: number) => UsageEntry[]
  tournamentUsage: (regId: string, tournamentId: string | number) => UsageEntry[]
  standings: (regId: string, tournamentId: string | number) => PlayerEntry[]
  divergence: (regId: string, tournamentId: string | number) => DivergenceResult | null
  className?: string
  density?: "compact" | "comfortable"
  nav?: "split" | "drill"
}

export function VgcMeta({
  pokeMap,
  formats,
  tourRegs,
  tournaments,
  cutoffs,
  cutoffLabel,
  ladderUsage,
  tournamentUsage,
  standings,
  divergence,
  className,
  density = "compact",
  nav = "split",
}: VgcMetaProps) {
  const [tab, setTab] = useState("stats")
  const [format, setFormat] = useState("regi")
  const [month, setMonth] = useState(formats.regi?.months[0] || "")
  const [cutoff, setCutoff] = useState(1630)
  const [regulation, setRegulation] = useState("regi")
  const [tournamentId, setTournamentId] = useState<string | number>("combined")
  const [view, setView] = useState("aggregate")

  const drill = nav === "drill"
  const [selId, setSelId] = useState<string | null>(null)

  const statsEntries = useMemo(
    () => ladderUsage(format, month, cutoff),
    [format, month, cutoff, ladderUsage],
  )
  const tourEntries = useMemo(
    () => tournamentUsage(regulation, tournamentId),
    [regulation, tournamentId, tournamentUsage],
  )
  const players = useMemo(
    () => (tab === "tournament" && view === "players" ? standings(regulation, tournamentId) : []),
    [tab, view, regulation, tournamentId, standings],
  )
  const diverg = useMemo(
    () => (tab === "tournament" && view === "divergence" ? divergence(regulation, tournamentId) : null),
    [tab, view, regulation, tournamentId, divergence],
  )

  const entries = tab === "stats" ? statsEntries : tourEntries
  const regId = tab === "stats" ? format : regulation
  const fmt = formats[format]
  const totalBattles = statsEntries.reduce((a, e) => a + e.count, 0)
  const totalTeams = tourEntries.reduce((a, e) => a + e.count, 0)
  const tours = tournaments[regulation] || []
  const curTour = tours.find((t) => String(t.id) === String(tournamentId))

  useEffect(() => {
    if (drill) return
    if (!entries.some((e) => e.id === selId)) {
      setSelId(entries[0]?.id || null)
    }
  }, [entries, drill, selId])

  const onTab = (t: string) => { setTab(t); if (drill) setSelId(null) }
  const onFormat = (f: string) => {
    setFormat(f)
    setMonth(formats[f]?.months[0] || "")
    if (drill) setSelId(null)
  }
  const onReg = (r: string) => {
    setRegulation(r)
    setTournamentId("combined")
    if (drill) setSelId(null)
  }

  const sel = entries.find((e) => e.id === selId) || (drill ? null : entries[0])
  const detail = sel ? pokeMap[sel.id] : null

  const toolbar = (
    <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">
      <SegTabs
        value={tab}
        options={[
          { value: "stats", label: "Stats" },
          { value: "tournament", label: "Torneo" },
        ]}
        onChange={onTab}
        size="sm"
      />
      <span className="w-px h-5 bg-[var(--border)] mx-0.5" />
      {tab === "stats" ? (
        <>
          <ToolSelect
            value={format}
            icon="filter"
            width="220px"
            minWidth="150px"
            items={[
              { header: "Smogon" },
              ...Object.values(formats).map((f) => ({ value: f.id, label: f.label })),
            ]}
            onSelect={onFormat}
          />
          <ToolSelect
            value={month}
            width="150px"
            minWidth="120px"
            items={fmt?.months.map((m) => ({ value: m, label: m })) || []}
            onSelect={setMonth}
          />
          <ToolSelect
            value={cutoff}
            width="140px"
            minWidth="110px"
            items={cutoffs.map((c) => ({ value: c, label: cutoffLabel(c) }))}
            onSelect={(v) => setCutoff(Number(v))}
          />
        </>
      ) : (
        <>
          <ToolSelect
            value={regulation}
            icon="filter"
            width="160px"
            minWidth="120px"
            items={tourRegs.map((r) => ({ value: r.id, label: r.name }))}
            onSelect={onReg}
          />
          <ToolSelect
            value={String(tournamentId)}
            width="270px"
            minWidth="200px"
            align="right"
            items={tours.map((t) => ({
              value: t.id,
              label: t.id === "combined" ? "Combinado" : `${t.name}${t.date ? " — " + t.date : ""}`,
            }))}
            onSelect={(v) => setTournamentId(v === "combined" ? "combined" : Number(v))}
          />
        </>
      )}
      <div className="flex-1" />
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-1.5 py-[0.15rem] rounded-[var(--radius-pill)] border border-[var(--border)] text-[var(--text-dim)]">
        <Icon name="database" size={13} />
        {tab === "stats" ? `${fmtCount(totalBattles)} batallas` : `${fmtCount(totalTeams)} equipos`}
      </span>
    </div>
  )

  const subbar = tab === "stats" ? (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)]">
      <span className="inline-flex font-mono text-[10px] px-1.5 py-[0.15rem] rounded-[var(--radius-pill)] border border-[var(--border)] text-[var(--text-dim)]">
        {fmt?.label}
      </span>
      <span className="text-xs">{fmt?.note}</span>
      <span className="flex items-center gap-1 ml-auto font-mono text-[var(--text-dim)]">
        <Icon name="info" size={12} />
        {cutoffLabel(cutoff)} · {month}
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)]">
      <SegTabs
        value={view}
        size="sm"
        options={[
          { value: "aggregate", label: "Agregado" },
          { value: "players", label: "Jugadores" },
          { value: "divergence", label: "Divergencia" },
        ]}
        onChange={setView}
      />
      <span className="ml-auto font-mono text-[var(--text-dim)]">
        {curTour
          ? curTour.id === "combined"
            ? `Combinado · ${tours.length - 1} torneos`
            : `${curTour.name}${curTour.players ? ` · ${fmtCount(curTour.players)} jug.` : ""}`
          : ""}
      </span>
    </div>
  )

  let body: React.ReactNode
  if (tab === "tournament" && view === "players") {
    body = <VgcStandingsView players={players} />
  } else if (tab === "tournament" && view === "divergence") {
    body = <VgcDivergenceView result={diverg} pokeMap={pokeMap} />
  } else if (drill) {
    body = !detail ? (
      <VgcUsageSidebar entries={entries} pokeMap={pokeMap} selectedId={selId} onSelect={setSelId} />
    ) : (
      <VgcPokemonDetail
        detail={detail}
        entry={sel!}
        pokeMap={pokeMap}
        onSelect={setSelId}
        onBack={() => setSelId(null)}
        drill
      />
    )
  } else {
    body = (
      <div className="flex-1 min-h-0 flex w-full">
        <aside className="w-[320px] shrink-0 flex flex-col min-h-0 border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_40%,transparent)]">
          <VgcUsageSidebar entries={entries} pokeMap={pokeMap} selectedId={sel?.id || null} onSelect={setSelId} />
        </aside>
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          {detail ? (
            <VgcPokemonDetail detail={detail} entry={sel!} pokeMap={pokeMap} onSelect={setSelId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--text-dim)] p-8">
              <Icon name="database" size={26} />
              <p className="text-sm max-w-[32ch] text-center">Elige un Pokémon de la lista para ver su detalle competitivo.</p>
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <ToolApp
      className={cn("vgc-app", className)}
      toolbar={toolbar}
      subbar={subbar}
    >
      {body}
    </ToolApp>
  )
}
