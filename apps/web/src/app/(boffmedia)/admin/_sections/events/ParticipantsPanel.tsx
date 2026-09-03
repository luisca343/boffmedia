"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Select, Spinner } from "@boffmedia/ui"
import { AvAlert, AvPanel, AvPill } from "../../_components/ui/av-kit"
import { cn } from "@/lib/utils"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import type { ApiResponse } from "@/services/http/core"
import type { Participant } from "@boffmedia/shared"

type Status = "registered" | "confirmed" | "declined" | "removed"

// Status colour, shown as a dot instead of a pill so the row stays one line.
const DOT: Record<Status, string> = {
  registered: "bg-ok",
  confirmed: "bg-accent",
  declined: "bg-warn",
  removed: "bg-txt-dim",
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
      if (!res.success) setError(res.userMessage ?? t("loadError"))
    } catch (e) {
      setRows([])
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [eventId, t])

  useEffect(() => {
    load()
  }, [load])

  const run = async (
    participantId: number,
    fn: () => Promise<ApiResponse<unknown>>
  ) => {
    setBusy(participantId)
    setError(null)
    try {
      const res = await fn()
      // `error` is the machine code (CONFLICT, BAD_REQUEST); only
      // `userMessage` is meant to be read. And a failed mutation changed
      // nothing, so re-listing after one just hid the failure.
      if (!res.success) setError(res.userMessage ?? t("actionError"))
      else await load()
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
      <div className="flex items-baseline gap-2 flex-wrap mb-3">
        <AvPill tone="default">{t("count", { count: rows.length })}</AvPill>
        <p className="text-xs text-txt-dim flex-1 min-w-[15rem]">{t("desc")}</p>
      </div>
      {error && <AvAlert tone="error" className="mb-3">{error}</AvAlert>}

      {rows.length === 0 ? (
        <p className="text-txt-dim text-sm py-6 text-center">{t("empty")}</p>
      ) : (
        <div className="border border-solid border-line bg-panel-2 cut-tag cut-tag-edge divide-y divide-line">
          {rows.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-1.5">
              <span
                className={cn("w-[0.4375rem] h-[0.4375rem] shrink-0 rotate-45", DOT[p.status as Status] ?? "bg-txt-dim")}
                title={t(`status.${p.status}`)}
              />

              <span className="font-medium text-sm truncate">
                {p.nickname ?? `#${p.participantId}`}
              </span>
              <span className="font-mono text-[0.6875rem] text-txt-dim truncate hidden sm:inline">
                {t("userId", { id: p.userId ?? "—" })}
              </span>

              <span className="flex-1" />

              <Select
                value={p.status}
                className="w-[9.375rem] py-[0.3125rem] px-[0.5625rem] pr-8 text-[0.8125rem]"
                ariaLabel={t("title")}
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
