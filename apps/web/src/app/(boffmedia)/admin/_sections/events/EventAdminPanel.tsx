"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, ConfirmDialog } from "@boffmedia/ui"
import { AvAlert, AvPanel, AvPill, AvSectionHead, AvViewLink } from "../../_components/ui/av-kit"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { ApiError } from "@/services/http/core"
import { useApiError } from "@/hooks/useApiError"
import { EventRandomizerPanel } from "./randomizer/EventRandomizerPanel"
import { ParticipantsPanel } from "./ParticipantsPanel"
import { EventInvitesPanel } from "./EventInvitesPanel"
import type { Event as EventType } from "@boffmedia/shared"

type EventStatus = "upcoming" | "active" | "completed"
type Tab = "config" | "participants" | "invites"

const STATUS_TONE: Record<EventStatus, "amber" | "green" | "muted"> = {
  upcoming: "amber",
  active: "green",
  completed: "muted",
}

export function EventAdminPanel({ event, onBack }: { event: EventType; onBack: () => void }) {
  const t = useTranslations("admin.events.panel")
  const apiError = useApiError()
  const eventId = Number(event.id)
  const [status, setStatus] = useState<EventStatus>(event.status as EventStatus)
  const [tab, setTab] = useState<Tab>("config")
  const [busy, setBusy] = useState<EventStatus | null>(null)
  const [pendingMove, setPendingMove] = useState<EventStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // The lifecycle runs forward; going back is a real but deliberate action, so
  // it asks first and sends `reopen`. The server still refuses a reopen while a
  // non-draft randomizer config is attached — this only saves a round trip on
  // the accidental click.
  const RANK: Record<EventStatus, number> = { upcoming: 0, active: 1, completed: 2 }

  const move = (next: EventStatus) =>
    RANK[next] < RANK[status] ? setPendingMove(next) : run(next)

  const run = async (next: EventStatus) => {
    const backwards = RANK[next] < RANK[status]
    setPendingMove(null)
    setBusy(next)
    setError(null)
    try {
      const res = await EventsService.setEventStatus(eventId, next, backwards)
      // Render the server's user-facing text, never its machine `error` code.
      if (!res.success) setError(apiError(new ApiError(res), t("statusFailed")))
      else setStatus(next)
    } catch (e) {
      setError(apiError(e, t("statusFailed")))
    } finally {
      setBusy(null)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "config", label: t("tabConfig") },
    { key: "participants", label: t("tabParticipants") },
    { key: "invites", label: t("tabInvites") },
  ]

  return (
    <div>
      <AvSectionHead
        title={event.title}
        desc={t("desc")}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AvPill tone={STATUS_TONE[status] ?? "muted"}>{t(`status.${status}`)}</AvPill>
            <AvViewLink href={`/eventos/${event.id}`} label={t("viewPage")} />
            <Button variant="ghost" size="sm" icon="back" onClick={onBack}>
              {t("back")}
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-5">
        {tabs.map((x) => (
          <Button
            key={x.key}
            size="sm"
            variant={tab === x.key ? "pri" : "ghost"}
            onClick={() => setTab(x.key)}
          >
            {x.label}
          </Button>
        ))}
      </div>

      {tab === "config" && (
        <div>
          <AvPanel title={t("lifecycle")}>
            <div>
              <p className="text-[0.8125rem] text-txt-muted mb-3">{t("lifecycleDesc")}</p>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {(["upcoming", "active", "completed"] as EventStatus[]).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={status === s ? "pri" : "ghost"}
                    loading={busy === s}
                    disabled={status === s}
                    onClick={() => move(s)}
                  >
                    {t(`status.${s}`)}
                  </Button>
                ))}
              </div>
              {error && <AvAlert tone="error">{error}</AvAlert>}
            </div>
          </AvPanel>

          <AvPanel title={t("randomizerSection")}>
            <div>
              <p className="text-[0.8125rem] text-txt-muted mb-3">{t("randomizerSectionDesc")}</p>
              {/* Opening a randomizer config requires an active event — it no longer
                  activates one as a side effect, so say so before the attempt fails. */}
              {status !== "active" && (
                <AvAlert tone="warning" className="mb-4">
                  {t("notActiveNotice")}
                </AvAlert>
              )}
              <EventRandomizerPanel event={event} onBack={onBack} embedded />
            </div>
          </AvPanel>
        </div>
      )}
      {tab === "participants" && <ParticipantsPanel eventId={eventId} />}
      {tab === "invites" && (
        <EventInvitesPanel eventId={eventId} isPrivate={event.visibility === "private"} />
      )}

      <ConfirmDialog
        open={pendingMove != null}
        title={t("reopenTitle")}
        body={pendingMove ? t("reopenConfirm", { from: t(`status.${status}`), to: t(`status.${pendingMove}`) }) : null}
        confirmLabel={t("reopenCta")}
        busy={busy != null}
        onConfirm={() => pendingMove && run(pendingMove)}
        onClose={() => setPendingMove(null)}
      />
    </div>
  )
}
