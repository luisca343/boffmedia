"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { DkSeg } from "@/components/boffmedia/ui/tools/datakit"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournaments } from "@/hooks/tournaments/useTournaments"
import type { TournamentSummaryApi } from "@/services/api/boffmedia/tournamentsService"

type Filter = "all" | "live" | "registration" | "completed"

const DOT_TONE: Record<string, string> = {
  live: "bg-accent",
  registration: "bg-ok",
  completed: "bg-txt-dim",
  draft: "bg-line-2",
  cancelled: "bg-bad",
}

export default function TorneosPage() {
  const { tournaments, isLoading } = useTournaments()
  const [filter, setFilter] = useState<Filter>("all")

  const shown = useMemo(
    () =>
      tournaments
        .filter((t) => t.status !== "draft" && t.status !== "cancelled")
        .filter((t) => (filter === "all" ? true : t.status === filter)),
    [tournaments, filter],
  )

  return (
    <main className="wrap py-10">
      <header className="mb-6 grid gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-txt-dim">
          Comunidad
        </span>
        <h1 className="text-[clamp(34px,5vw,56px)]">Torneos</h1>
        <p className="max-w-xl font-body text-[14px] leading-[1.55] text-txt-muted">
          Cuadros de eliminación, ligas, grupos y clasificaciones de la comunidad Boffmedia.
        </p>
      </header>

      <div className="mb-5">
        <DkSeg
          size="sm"
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          ariaLabel="Filtrar torneos"
          options={[
            { value: "all", label: "Todos" },
            { value: "live", label: "En directo" },
            { value: "registration", label: "Inscripción" },
            { value: "completed", label: "Finalizados" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : shown.length === 0 ? (
        <div className="border border-dashed border-line-2 bg-panel px-6 py-16 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-txt-dim">
            No hay torneos por ahora.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <TorneoCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </main>
  )
}

function TorneoCard({ t }: { t: TournamentSummaryApi }) {
  return (
    <Link
      href={`/torneos/${t.slug}`}
      className="cut-corner group grid content-start gap-3 border border-solid border-line bg-panel p-4 transition-colors hover:border-line-2"
    >
      <div className="flex items-center justify-between">
        <TnFormatBadge format={t.format} size="sm" />
        <span className={cn("h-2 w-2 rounded-full", DOT_TONE[t.status] ?? "bg-line-2")} />
      </div>
      <h2 className="font-display text-[18px] font-bold uppercase not-italic leading-[1.05] tracking-[0.01em] transition-colors group-hover:text-accent-bright">
        {t.name}
      </h2>
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] text-txt-dim">
        {t.gameTitle && <span>{t.gameTitle}</span>}
        <span>{t.participantCount} jugadores</span>
        {t.championName && <span className="text-accent">🏆 {t.championName}</span>}
      </div>
    </Link>
  )
}
