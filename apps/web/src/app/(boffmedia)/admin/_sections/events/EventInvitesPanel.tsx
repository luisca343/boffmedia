"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Spinner } from "@boffmedia/ui"
import { AvAlert, AvPanel, AvPill } from "../../_components/ui/av-kit"
import { EventsService, type EventInvite } from "@/services/api/boffmedia/eventsService"

export function EventInvitesPanel({
  eventId,
  isPrivate,
}: {
  eventId: number
  isPrivate: boolean
}) {
  const t = useTranslations("admin.events.invites")
  const [rows, setRows] = useState<EventInvite[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [maxUses, setMaxUses] = useState("1")
  const [expiresAt, setExpiresAt] = useState("")
  const [creating, setCreating] = useState(false)
  const [busyCode, setBusyCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await EventsService.getEventInvites(eventId)
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

  const create = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await EventsService.createEventInvite(
        eventId,
        Math.max(1, Number(maxUses) || 1),
        expiresAt ? new Date(expiresAt).toISOString() : undefined,
      )
      if (res.error) setError(res.error)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setCreating(false)
    }
  }

  const revoke = async (code: string) => {
    setBusyCode(code)
    setError(null)
    try {
      const res = await EventsService.revokeEventInvite(code)
      if (res.error) setError(res.error)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyCode(null)
    }
  }

  const isLive = (i: EventInvite) =>
    !i.revoked && i.uses < i.maxUses && (!i.expiresAt || new Date(i.expiresAt) > new Date())

  return (
    <AvPanel title={t("title")} icon="link">
      <p className="text-sm text-txt-muted mb-4">{t("desc")}</p>

      {!isPrivate && <AvAlert tone="info" className="mb-4">{t("publicNotice")}</AvAlert>}
      {error && <AvAlert tone="error" className="mb-4">{error}</AvAlert>}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end mb-5">
        <Field label={t("maxUsesLabel")} hint={t("maxUsesHint")}>
          <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
        </Field>
        <Field label={t("expiresLabel")} hint={t("expiresHint")}>
          <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
        <Button variant="pri" icon="plus" loading={creating} onClick={create}>
          {t("create")}
        </Button>
      </div>

      {rows === null ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-txt-dim text-sm py-6 text-center">{t("empty")}</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((i) => (
            <div
              key={i.code}
              className="flex items-center gap-3 flex-wrap border border-solid border-line bg-panel-2 cut-tag px-3 py-2"
            >
              <code className="font-mono text-sm flex-1 min-w-0 break-all">{i.code}</code>
              <AvPill tone={isLive(i) ? "green" : "muted"}>
                {isLive(i) ? t("live") : t("spent")}
              </AvPill>
              <span className="text-xs text-txt-dim font-mono">
                {t("uses", { used: i.uses, max: i.maxUses })}
              </span>
              <Button
                size="sm"
                variant="ghost"
                icon="copy"
                title={t("copy")}
                onClick={() => navigator.clipboard?.writeText(i.code)}
              />
              <Button
                size="sm"
                variant="ghost"
                icon="trash"
                title={t("revoke")}
                loading={busyCode === i.code}
                disabled={i.revoked}
                onClick={() => revoke(i.code)}
              />
            </div>
          ))}
        </div>
      )}
    </AvPanel>
  )
}
