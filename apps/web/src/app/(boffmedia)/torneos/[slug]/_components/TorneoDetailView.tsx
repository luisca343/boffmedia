"use client"

import Link from "next/link"
import { use, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Badge, Button, Field, Input, Modal, toast, Icon, Spinner } from "@boffmedia/ui"
import { TnFormatBadge, TnEntrant, TnPodium } from "@/components/boffmedia/ui/tournaments"
import { useTournament } from "@/hooks/tournaments/useTournament"
import { useFormat } from "@boffmedia/ui/useFormat"
import {
  TournamentsService,
  type TournamentDetailApi,
} from "@/services/api/boffmedia/tournamentsService"
import { TorneoView } from "../../_components/TorneoView"
import { RegisterButton } from "../../_components/RegisterButton"
import { TeamsheetButton, TeamsheetViewButton } from "../../_components/TeamsheetEditor"
import * as A from "../../_lib/adapt"

const STATUS_TONE: Record<string, string> = {
  live: "text-accent-bright border-accent-line [--cut-line:var(--accent-line)]",
  registration: "text-ok border-ok [--cut-line:var(--ok)]",
  completed: "text-txt-muted border-line-2 [--cut-line:var(--line-2)]",
  draft: "text-txt-dim border-line [--cut-line:var(--line)]",
  cancelled: "text-bad border-bad [--cut-line:var(--bad)]",
}

function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
}

export function TorneoDetailView({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const t = useTranslations("torneos")
  const { intlLocale } = useFormat()
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
        <p className="font-display text-[1.375rem] font-bold uppercase">{t("detail.notFound")}</p>
        <Button href="/torneos" size="sm" className="mt-4">
          {t("detail.backToList")}
        </Button>
      </main>
    )
  }

  const start = formatDate(tn.startDate, intlLocale)
  const end = formatDate(tn.endDate, intlLocale)
  const preStart = tn.status === "registration" || tn.status === "draft"

  return (
    <main className="wrap py-10">
      {tn.banner && (
        <div className="mb-6 aspect-[3/1] w-full overflow-hidden border border-solid border-line bg-panel">
          <img src={tn.banner} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <header className="mb-7 grid gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-txt-dim">
            {t("detail.section")}
          </span>
          <span
            className={cn(
              "inline-flex items-center border border-solid px-2 py-[3px] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] cut cut-edge-slant [--cut:4px]",
              STATUS_TONE[tn.status] ?? "text-txt-dim border-line [--cut-line:var(--line)]",
            )}
          >
            {t(`status.${tn.status}`)}
          </span>
        </div>
        <h1 className="text-[clamp(1.875rem,5vw,3rem)]">{tn.name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.71875rem] text-txt-muted">
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
          <p className="max-w-2xl font-body text-[0.875rem] leading-[1.55] text-txt-muted">
            {tn.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <RegisterButton detail={tn} onChange={refetch} />
          <CheckInButton detail={tn} onChange={refetch} />
          <SubmitScoreButton detail={tn} onChange={refetch} />
        </div>
      </header>

      <EventGate detail={tn} />
      <EntryChecklist detail={tn} onChange={refetch} />
      <MyMatchBanner detail={tn} />
      <OpenTeamsheets detail={tn} />

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

/**
 * A tournament composed into an event draws its field from that event, so a
 * non-member's register button will be refused. Say so where they can act on
 * it, with the link, instead of after a failed request.
 */
function EventGate({ detail }: { detail: TournamentDetailApi }) {
  const t = useTranslations("torneos.entry")
  const ev = detail.event
  if (!ev) return null
  const open = detail.status === "draft" || detail.status === "registration"
  if (!open || ev.viewerIsMember || detail.viewerParticipantId != null) return null

  return (
    <div className="cut-seal cut-seal-edge [--cut-line:var(--warn)] [--cut:8px] mb-6 flex flex-wrap items-center gap-3 border border-solid border-warn bg-warn-soft px-4 py-3">
      <Icon name="alert" size={16} className="flex-none text-warn" />
      <span className="flex-1 font-body text-[0.875rem] text-txt">
        {t("eventGate", { event: ev.title })}
      </span>
      <Button size="sm" variant="pri" href={`/eventos/${ev.id}`}>
        {t("eventGateCta")}
      </Button>
    </div>
  )
}

/**
 * Registering is an intention; entering is the commitment the pairings are
 * built from. The server sends exactly what is still missing, so this is a
 * checklist rather than a second implementation of the rule.
 */
function EntryChecklist({
  detail,
  onChange,
}: {
  detail: TournamentDetailApi
  onChange: () => void
}) {
  const t = useTranslations("torneos.entry")
  if (detail.viewerParticipantId == null) return null
  if (detail.status !== "draft" && detail.status !== "registration") return null

  // Resolution can happen at an entry deadline, well before the start: from
  // then on this player is out of the field but can still fix what they were
  // missing, so say so instead of showing the ordinary pending copy.
  const me = detail.participants.find(
    (p) => p.id === detail.viewerParticipantId,
  )
  const droppedOut = me?.status === "dropped"

  const gaps = detail.viewerEntryGaps ?? []
  const steps: { key: string; done: boolean }[] = [
    { key: "registered", done: true },
    ...(detail.teamsheetRequired
      ? [{ key: "teamsheet", done: !gaps.includes("teamsheet") }]
      : []),
    { key: "checkin", done: !gaps.includes("check-in") },
  ]
  const entered = gaps.length === 0 && !droppedOut

  return (
    <div
      className={cn(
        "cut-seal cut-seal-edge [--cut:8px] mb-6 border border-solid px-4 py-3",
        droppedOut
          ? "[--cut-line:var(--bad)] border-bad bg-bad-soft"
          : entered
          ? "[--cut-line:var(--ok)] border-ok bg-ok-soft"
          : "[--cut-line:var(--accent-line)] border-accent-line bg-accent-soft",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon
          name={droppedOut ? "alert" : entered ? "check" : "clock"}
          size={16}
          className={cn(
            "flex-none",
            droppedOut ? "text-bad" : entered ? "text-ok" : "text-accent-bright",
          )}
        />
        <span className="font-body text-[0.875rem] font-semibold text-txt">
          {droppedOut
            ? t("droppedTitle")
            : entered
              ? t("enteredTitle")
              : t("pendingTitle")}
        </span>
      </div>
      {/* Done in green, everything else neutral: green is the only colour in
          the row, so what is left to do reads without parsing the labels. */}
      <ul className="flex flex-wrap gap-2">
        {steps.map((s) => (
          <li key={s.key}>
            <Badge
              tone={s.done ? "ok" : "default"}
              className="inline-flex items-center gap-1.5"
            >
              <Icon
                name={s.done ? "check" : "minus"}
                size={11}
                className="flex-none"
              />
              {t(`step.${s.key}`)}
            </Badge>
          </li>
        ))}
      </ul>
      {!entered && (
        <p className="mt-2 font-body text-[0.78125rem] leading-[1.45] text-txt-muted">
          {droppedOut
            ? t("droppedLead")
            : detail.entryDeadline
              ? t("pendingLeadDeadline", {
                  date: new Date(detail.entryDeadline).toLocaleString(),
                })
              : t("pendingLead")}
        </p>
      )}
      {detail.teamsheetRequired && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-solid border-line pt-3">
          <TeamsheetButton
            tournamentId={detail.id}
            sheet={detail.viewerTeamsheet}
            onSaved={onChange}
          />
          <TeamsheetViewButton sheet={detail.viewerTeamsheet} />
        </div>
      )}
    </div>
  )
}

/**
 * Every entrant's sheet, on a tournament that publishes them.
 *
 * Purely payload-driven: the server only fills `participants[].teamsheet` when
 * this viewer is allowed to read it AND the tournament has started, so there is
 * no visibility rule to re-implement here — sheets present means show them.
 */
function OpenTeamsheets({ detail }: { detail: TournamentDetailApi }) {
  const t = useTranslations("torneos.teamsheet")
  const withSheets = detail.participants.filter((p) => p.teamsheet?.length)
  if (!withSheets.length) return null

  return (
    <details className="group mb-6 border border-solid border-line bg-panel" open>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-txt-muted">
        {t("rosterTitle", { count: withSheets.length })}
        <span className="transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="grid gap-1.5 border-t border-solid border-line p-4 sm:grid-cols-2 lg:grid-cols-3">
        {withSheets.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 border border-solid border-line bg-base px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate font-body text-[0.8125rem]">{p.name}</span>
            <TeamsheetViewButton sheet={p.teamsheet} name={p.name} />
          </div>
        ))}
      </div>
    </details>
  )
}

/** Link the signed-in participant straight to their playable match. */
function MyMatchBanner({ detail }: { detail: TournamentDetailApi }) {
  const t = useTranslations("torneos.detail")
  if (detail.myMatchId == null) return null
  return (
    <Link
      href={`/torneos/${detail.slug}/partida/${detail.myMatchId}`}
      // A notice strip, so it takes Banner's `cut-seal` shape rather than the
      // pill parallelogram. It stays a hand-built <Link> because Banner has no
      // clickable form — the shape is what had to stop diverging.
      className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:8px] mb-6 flex items-center gap-3 border border-solid border-accent-line bg-accent-soft px-4 py-3 transition-opacity hover:opacity-85"
    >
      <Icon name="zap" size={16} className="flex-none text-accent-bright" />
      <span className="flex-1 font-body text-[0.875rem] font-semibold text-txt">
        {t("myMatchBanner")}
      </span>
      <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-accent-bright">
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
          <p className="font-mono text-[0.65625rem] leading-[1.5] text-txt-dim">
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
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-txt-muted">
        {title}
        <span className="transition-transform group-open:rotate-90">›</span>
      </summary>
      <p className="whitespace-pre-wrap border-t border-line px-4 py-3 font-body text-[0.8125rem] leading-[1.6] text-txt-muted">
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
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.08em] text-txt-dim">
          {t("rosterEmpty")}
        </p>
      </div>
    )
  }
  return (
    <section className="grid gap-3">
      <h2 className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-txt-dim">
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
