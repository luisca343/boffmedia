"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Select, Spinner } from "@boffmedia/ui"
import { AvAlert, AvPanel, AvPill } from "../../_components/ui/av-kit"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import type { Participant } from "@boffmedia/shared"

type Status = "registered" | "confirmed" | "declined" | "removed"

const TONE: Record<Status, "green" | "accent" | "amber" | "muted"> = {
  registered: "green",
  confirmed: "accent",
  declined: "amber",
  removed: "muted",
}

export function ParticipantsPanel({ eventId }: { eventId: number }) {
  const t = useTranslations("admin.events.participants")
  const [rows, setRows] = useState<Participant[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await EventsService.getEventParticipants(eventId)
      setRows(res.success ? (res.data ?? []) : [])
      if (!res.success) setError(res.error ?? t("loadError"))
    } catch (e) {
      setRows([])
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [eventId, t])

  useEffect(() => {
    load()
  }, [load])

  const run = async (participantId: number, fn: () => Promise<{ error?: string }>) => {
    setBusy(participantId)
    setError(null)
    try {
      const res = await fn()
      if (res.error) setError(res.error)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  if (rows === null) {
    return (
      <AvPanel>
        <div className="flex items-center justify-center py-8 gap-2">
          <Spinner />
          <span className="text-txt-muted">{t("loading")}</span>
        </div>
      </AvPanel>
    )
  }

  return (
    <AvPanel title={t("title")} icon="users">
      <p className="text-sm text-txt-muted mb-4">{t("desc")}</p>
      {error && <AvAlert tone="error" className="mb-4">{error}</AvAlert>}

      {rows.length === 0 ? (
        <p className="text-txt-dim text-sm py-6 text-center">{t("empty")}</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 flex-wrap border border-solid border-line bg-panel-2 cut-tag px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium">{p.nickname ?? `#${p.participantId}`}</span>
                <p className="text-xs text-txt-dim font-mono">
                  {t("userId", { id: p.userId ?? "—" })}
                </p>
              </div>

              <AvPill tone={TONE[p.status as Status] ?? "muted"}>{t(`status.${p.status}`)}</AvPill>

              <Select
                value={p.status}
                options={(["registered", "confirmed", "declined", "removed"] as Status[]).map((s) => ({
                  value: s,
                  label: t(`status.${s}`),
                }))}
                disabled={busy === p.participantId}
                onChange={(v) =>
                  run(p.participantId, () =>
                    EventsService.setParticipantStatus(eventId, p.participantId, v as Status),
                  )
                }
              />

              <Button
                size="sm"
                variant="ghost"
                icon="trash"
                title={t("remove")}
                loading={busy === p.participantId}
                onClick={() =>
                  run(p.participantId, () => EventsService.removeParticipant(eventId, p.participantId))
                }
              />
            </div>
          ))}
        </div>
      )}
    </AvPanel>
  )
}
