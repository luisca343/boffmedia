"use client"

import { use } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/boffmedia/primitives"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
import { TorneoView } from "../_components/TorneoView"
import { RegisterButton } from "../_components/RegisterButton"

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  registration: "Inscripción abierta",
  live: "En directo",
  completed: "Finalizado",
  cancelled: "Cancelado",
}

const STATUS_TONE: Record<string, string> = {
  live: "text-accent-bright border-accent-line",
  registration: "text-ok border-ok",
  completed: "text-txt-muted border-line-2",
  draft: "text-txt-dim border-line",
  cancelled: "text-bad border-bad",
}

export default function TorneoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { tournament: t, isLoading, refetch } = useTournament(slug)

  if (isLoading) {
    return (
      <div className="wrap grid place-items-center py-24">
        <Spinner />
      </div>
    )
  }
  if (!t) {
    return (
      <main className="wrap py-24 text-center">
        <p className="font-display text-[22px] font-bold uppercase">Torneo no encontrado</p>
        <Button href="/torneos" size="sm" className="mt-4">
          Volver a torneos
        </Button>
      </main>
    )
  }

  return (
    <main className="wrap py-10">
      <header className="mb-7 grid gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-txt-dim">
            Torneo
          </span>
          <span
            className={cn(
              "inline-flex items-center border border-solid px-2 py-[3px] font-mono text-[10px] font-semibold uppercase tracking-[0.08em] cut [--cut:4px]",
              STATUS_TONE[t.status] ?? "text-txt-dim border-line",
            )}
          >
            {STATUS_LABEL[t.status] ?? t.status}
          </span>
        </div>
        <h1 className="text-[clamp(30px,5vw,48px)]">{t.name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11.5px] text-txt-muted">
          <TnFormatBadge format={t.format} />
          {t.gameTitle && <span>{t.gameTitle}</span>}
          <span>{t.participants.length} participantes</span>
          {t.champion && (
            <span className="font-semibold text-accent-bright">🏆 {t.champion.name}</span>
          )}
        </div>
        {t.description && (
          <p className="max-w-2xl font-body text-[14px] leading-[1.55] text-txt-muted">
            {t.description}
          </p>
        )}
        <div>
          <RegisterButton detail={t} onChange={refetch} />
        </div>
      </header>

      <TorneoView detail={t} />
    </main>
  )
}
