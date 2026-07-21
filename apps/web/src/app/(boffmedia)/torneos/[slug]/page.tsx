"use client"

import Link from "next/link"
import { use, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Field, Input, Modal, toast, Icon, Spinner } from "@/components/boffmedia/primitives"
import { TnFormatBadge, TnEntrant, TnPodium } from "@/components/boffmedia/ui/tournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
import {
  TournamentsService,
  type TournamentDetailApi,
} from "@/services/api/boffmedia/tournamentsService"
import { TorneoView } from "../_components/TorneoView"
import { RegisterButton } from "../_components/RegisterButton"
import * as A from "../_lib/adapt"

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
  const t = useTranslations("torneos")
  const { slug } = use(params)
  const { tournament: tn, isLoading, refetch } = useTournament(slug)

  if (isLoading) {
    return (
      <div className="wrap grid place-items-center py-24">
        <Spinner />
      </div>
    )
  }
  if (!tn) {
    return (
      <main className="wrap py-24 text-center">
        <p className="font-display text-[22px] font-bold uppercase">{t("detail.notFound")}</p>
        <Button href="/torneos" size="sm" className="mt-4">
          {t("detail.backToList")}
        </Button>
      </main>
    )
  }

  const start = formatDate(tn.startDate)
  const end = formatDate(tn.endDate)
  const preStart = tn.status === "registration" || tn.status === "draft"

  return (
    <main className="wrap py-10">
      {tn.banner && (
        <div className="mb-6 aspect-[3/1] w-full overflow-hidden border border-solid border-line bg-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tn.banner} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <header className="mb-7 grid gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-txt-dim">
            {t("detail.section")}
          </span>
          <span
            className={cn(
              "inline-flex items-center border border-solid px-2 py-[3px] font-mono text-[10px] font-semibold uppercase tracking-[0.08em] cut [--cut:4px]",
              STATUS_TONE[tn.status] ?? "text-txt-dim border-line",
            )}
          >
            {t(`status.${tn.status}`)}
          </span>
        </div>
        <h1 className="text-[clamp(30px,5vw,48px)]">{tn.name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11.5px] text-txt-muted">
          <TnFormatBadge format={tn.format} />
          {tn.gameTitle && <span>{tn.gameTitle}</span>}
          <span>
            {t("detail.participants", {
              count: tn.participants.length,
              max: tn.maxParticipants ? `/${tn.maxParticipants}` : "",
            })}
          </span>
          {(start || end) && (
            <span>
              {start}
              {start && end ? " — " : ""}
              {end}
            </span>
          )}
          {tn.status === "registration" && start && (
            <span className="text-ok">{t("detail.registrationDeadline", { date: start })}</span>
          )}
          {tn.champion && (
            <span className="font-semibold text-accent-bright">🏆 {tn.champion.name}</span>
          )}
        </div>
        {tn.description && (
          <p className="max-w-2xl font-body text-[14px] leading-[1.55] text-txt-muted">
            {tn.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <RegisterButton detail={tn} onChange={refetch} />
          <CheckInButton detail={tn} onChange={refetch} />
          <SubmitScoreButton detail={tn} onChange={refetch} />
        </div>
      </header>

      <MyMatchBanner detail={tn} />

      {tn.rules && <FoldBlock title={t("detail.rulesTitle")} body={tn.rules} />}
      {tn.prizes && <FoldBlock title={t("detail.prizesTitle")} body={tn.prizes} open />}

      {tn.status === "completed" && tn.podium.length > 0 && (
        <div className="mb-8">
          <TnPodium podium={tn.podium.map((p) => A.comp(p)!)} />
        </div>
      )}

      {preStart ? <RegistrationRoster detail={tn} /> : <TorneoView detail={tn} />}
    </main>
  )
}

/** Link the signed-in participant straight to their playable match. */
function MyMatchBanner({ detail }: { detail: TournamentDetailApi }) {
  const t = useTranslations("torneos.detail")
  if (detail.myMatchId == null) return null
  return (
    <Link
      href={`/torneos/${detail.slug}/partida/${detail.myMatchId}`}
      className="cut mb-6 flex items-center gap-3 border border-solid border-accent-line bg-accent-soft px-4 py-3 transition-opacity hover:opacity-85 [--cut:6px]"
    >
      <Icon name="zap" size={16} className="flex-none text-accent-bright" />
      <span className="flex-1 font-body text-[14px] font-semibold text-txt">
        {t("myMatchBanner")}
      </span>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-bright">
        {t("myMatchCta")}
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
  const t = useTranslations("torneos.checkin")
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
      toast.success(checkedIn ? t("toastUndo") : t("toastDone"))
      onChange()
    }
  }

  return (
    <Button size="sm" variant={checkedIn ? "default" : "pri"} icon="check" disabled={busy} onClick={toggle}>
      {checkedIn ? t("undoCheckin") : t("doCheckin")}
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
  const t = useTranslations("torneos.score")
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
    if (score === "") return toast.error(t("validationRequired"))
    setBusy(true)
    const r = await TournamentsService.submitScore(detail.id, {
      score,
      meta: meta.trim() || undefined,
    })
    setBusy(false)
    if (r.error) toast.error(r.error)
    else {
      toast.success(t("toastOk"))
      setOpen(false)
      setScore("")
      setMeta("")
      onChange()
    }
  }

  return (
    <>
      <Button size="sm" variant="pri" icon="chart" onClick={() => setOpen(true)}>
        {t("submitBtn")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("modalTitle")}
        footer={
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button variant="pri" size="sm" disabled={busy} onClick={submit}>{t("submit")}</Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <Field label={detail.unit ? t("fieldLabelWithUnit", { unit: detail.unit }) : t("fieldLabel")}>
            <Input
              type="number"
              min={0}
              value={score}
              onChange={(e) => setScore(e.target.value === "" ? "" : Math.max(0, +e.target.value))}
            />
          </Field>
          <Field label={t("evidenceLabel")}>
            <Input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={t("evidencePlaceholder")} />
          </Field>
          <p className="font-mono text-[10.5px] leading-[1.5] text-txt-dim">
            {t("note")}
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
  const t = useTranslations("torneos.detail")
  if (detail.participants.length === 0) {
    return (
      <div className="border border-dashed border-line-2 bg-panel px-6 py-16 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-txt-dim">
          {t("rosterEmpty")}
        </p>
      </div>
    )
  }
  return (
    <section className="grid gap-3">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-txt-dim">
        {t("rosterTitle", { count: detail.participants.length })}
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
