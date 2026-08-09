"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@boffmedia/ui"
import { AvAlert, AvPill, AvSectionHead } from "../../_components/ui/av-kit"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { EventRandomizerPanel } from "./randomizer/EventRandomizerPanel"
import { ParticipantsPanel } from "./ParticipantsPanel"
import { EventInvitesPanel } from "./EventInvitesPanel"
import type { Event as EventType } from "@boffmedia/shared"

type EventStatus = "upcoming" | "active" | "completed"
type Tab = "randomizer" | "participants" | "invites"

const STATUS_TONE: Record<EventStatus, "amber" | "green" | "muted"> = {
  upcoming: "amber",
  active: "green",
  completed: "muted",
}

export function EventAdminPanel({ event, onBack }: { event: EventType; onBack: () => void }) {
  const t = useTranslations("admin.events.panel")
  const eventId = Number(event.id)
  const [status, setStatus] = useState<EventStatus>(event.status as EventStatus)
  const [tab, setTab] = useState<Tab>("randomizer")
  const [busy, setBusy] = useState<EventStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const move = async (next: EventStatus) => {
    setBusy(next)
    setError(null)
    try {
      const res = await EventsService.setEventStatus(eventId, next)
      if (res.error) setError(res.error)
      else setStatus(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "randomizer", label: t("tabRandomizer") },
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
            <Button variant="ghost" size="sm" icon="back" onClick={onBack}>
              {t("back")}
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="text-xs text-txt-dim uppercase tracking-[0.08em] font-mono">
          {t("lifecycle")}
        </span>
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

      {/* Opening a randomizer config requires an active event — it no longer
          activates one as a side effect, so say so before the attempt fails. */}
      {status !== "active" && (
        <AvAlert tone="warning" className="mb-4">
          {t("notActiveNotice")}
        </AvAlert>
      )}
      {error && <AvAlert tone="error" className="mb-4">{error}</AvAlert>}

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

      {tab === "randomizer" && <EventRandomizerPanel event={event} onBack={onBack} embedded />}
      {tab === "participants" && <ParticipantsPanel eventId={eventId} />}
      {tab === "invites" && (
        <EventInvitesPanel eventId={eventId} isPrivate={event.visibility === "private"} />
      )}
    </div>
  )
}
