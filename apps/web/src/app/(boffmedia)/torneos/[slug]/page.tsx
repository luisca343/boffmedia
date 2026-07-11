"use client"

import Link from "next/link"
import { use, useState } from "react"
import { cn } from "@/lib/utils"
import { Button, Field, Input, Modal, toast } from "@/components/boffmedia/primitives"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { TnFormatBadge, TnEntrant, TnPodium } from "@/components/boffmedia/ui/tournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
import {
  TournamentsService,
  type TournamentDetailApi,
} from "@/services/api/boffmedia/tournamentsService"
import { TorneoView } from "../_components/TorneoView"
import { RegisterButton } from "../_components/RegisterButton"
import * as A from "../_lib/adapt"

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

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
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

  const start = formatDate(t.startDate)
  const end = formatDate(t.endDate)
  const preStart = t.status === "registration" || t.status === "draft"

  return (
    <main className="wrap py-10">
      {t.banner && (
        <div className="mb-6 aspect-[3/1] w-full overflow-hidden border border-solid border-line bg-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.banner} alt="" className="h-full w-full object-cover" />
        </div>
      )}

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
          <span>
            {t.participants.length}
            {t.maxParticipants ? `/${t.maxParticipants}` : ""} participantes
          </span>
          {(start || end) && (
            <span>
              {start}
              {start && end ? " — " : ""}
              {end}
            </span>
          )}
          {t.status === "registration" && start && (
            <span className="text-ok">Inscripción hasta el {start}</span>
          )}
          {t.champion && (
            <span className="font-semibold text-accent-bright">🏆 {t.champion.name}</span>
          )}
        </div>
        {t.description && (
          <p className="max-w-2xl font-body text-[14px] leading-[1.55] text-txt-muted">
            {t.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <RegisterButton detail={t} onChange={refetch} />
          <CheckInButton detail={t} onChange={refetch} />
          <SubmitScoreButton detail={t} onChange={refetch} />
        </div>
      </header>

      <MyMatchBanner detail={t} />

      {t.rules && <FoldBlock title="Reglas" body={t.rules} />}
      {t.prizes && <FoldBlock title="Premios" body={t.prizes} open />}

      {t.status === "completed" && t.podium.length > 0 && (
        <div className="mb-8">
          <TnPodium podium={t.podium.map((p) => A.comp(p)!)} />
        </div>
      )}

      {preStart ? <RegistrationRoster detail={t} /> : <TorneoView detail={t} />}
    </main>
  )
}

/** Link the signed-in participant straight to their playable match. */
function MyMatchBanner({ detail }: { detail: TournamentDetailApi }) {
  if (detail.myMatchId == null) return null
  return (
    <Link
      href={`/torneos/${detail.slug}/partida/${detail.myMatchId}`}
      className="cut mb-6 flex items-center gap-3 border border-solid border-accent-line bg-accent-soft px-4 py-3 transition-opacity hover:opacity-85 [--cut:6px]"
    >
      <Icon name="zap" size={16} className="flex-none text-accent-bright" />
      <span className="flex-1 font-body text-[14px] font-semibold text-txt">
        Tu partida está lista — entra a la mesa para jugar y reportar el resultado.
      </span>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-bright">
        Ir a mi partida →
      </span>
    </Link>
  )
}

/** Check-in/out while the admin has the window open (registered players only). */
function CheckInButton({
  detail,
  onChange,
}: {
  detail: TournamentDetailApi
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)
  if (!detail.checkInOpen || detail.viewerParticipantId == null) return null
  const me = detail.participants.find((p) => p.id === detail.viewerParticipantId)
  const checkedIn = me?.checkedIn ?? false

  const toggle = async () => {
    setBusy(true)
    const r = checkedIn
      ? await TournamentsService.checkOut(detail.id)
      : await TournamentsService.checkIn(detail.id)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else {
      toast.success(checkedIn ? "Check-in anulado" : "¡Check-in hecho!")
      onChange()
    }
  }

  return (
    <Button size="sm" variant={checkedIn ? "default" : "pri"} icon="check" disabled={busy} onClick={toggle}>
      {checkedIn ? "✓ Presente — anular" : "Hacer check-in"}
    </Button>
  )
}

/** Leaderboard tournaments: submit/replace my score with optional evidence. */
function SubmitScoreButton({
  detail,
  onChange,
}: {
  detail: TournamentDetailApi
  onChange: () => void
}) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState<number | "">("")
  const [meta, setMeta] = useState("")
  const [busy, setBusy] = useState(false)

  const eligible =
    detail.format === "leaderboard" &&
    (detail.status === "live" ||
      (detail.status === "registration" && detail.registrationOpen))
  if (!eligible) return null

  const submit = async () => {
    if (score === "") return toast.error("Introduce tu marca")
    setBusy(true)
    const r = await TournamentsService.submitScore(detail.id, {
      score,
      meta: meta.trim() || undefined,
    })
    setBusy(false)
    if (r.error) toast.error(r.error)
    else {
      toast.success("Marca enviada — pendiente de verificación")
      setOpen(false)
      setScore("")
      setMeta("")
      onChange()
    }
  }

  return (
    <>
      <Button size="sm" variant="pri" icon="chart" onClick={() => setOpen(true)}>
        Enviar marca
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Enviar marca"
        footer={
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="pri" size="sm" disabled={busy} onClick={submit}>Enviar</Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <Field label={`Marca${detail.unit ? ` (${detail.unit})` : ""}`}>
            <Input
              type="number"
              min={0}
              value={score}
              onChange={(e) => setScore(e.target.value === "" ? "" : Math.max(0, +e.target.value))}
            />
          </Field>
          <Field label="Evidencia (clip, captura… — opcional)">
            <Input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="https://…" />
          </Field>
          <p className="font-mono text-[10.5px] leading-[1.5] text-txt-dim">
            Cada envío sustituye tu marca anterior y queda pendiente de verificación por un admin.
          </p>
        </div>
      </Modal>
    </>
  )
}

function FoldBlock({ title, body, open }: { title: string; body: string; open?: boolean }) {
  return (
    <details className="group mb-6 border border-solid border-line bg-panel" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-txt-muted">
        {title}
        <span className="transition-transform group-open:rotate-90">›</span>
      </summary>
      <p className="whitespace-pre-wrap border-t border-line px-4 py-3 font-body text-[13px] leading-[1.6] text-txt-muted">
        {body}
      </p>
    </details>
  )
}

/** Registration/draft: no bracket yet, so show who has signed up so far. */
function RegistrationRoster({ detail }: { detail: TournamentDetailApi }) {
  if (detail.participants.length === 0) {
    return (
      <div className="border border-dashed border-line-2 bg-panel px-6 py-16 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-txt-dim">
          Aún no hay inscritos. ¡Sé el primero!
        </p>
      </div>
    )
  }
  return (
    <section className="grid gap-3">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-txt-dim">
        Inscritos · {detail.participants.length}
      </h2>
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {detail.participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 border border-solid border-line bg-panel px-3 py-2"
          >
            <TnEntrant c={A.comp(p)!} />
          </div>
        ))}
      </div>
    </section>
  )
}
