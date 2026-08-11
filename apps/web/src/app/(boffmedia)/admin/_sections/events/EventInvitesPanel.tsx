"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Input, Spinner } from "@boffmedia/ui"
import { AvAlert, AvPanel } from "../../_components/ui/av-kit"
import { cn } from "@/lib/utils"
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
      <p className="text-xs text-txt-dim mb-3">{t("desc")}</p>

      {!isPrivate && <AvAlert tone="info" className="mb-3">{t("publicNotice")}</AvAlert>}
      {error && <AvAlert tone="error" className="mb-3">{error}</AvAlert>}

      {/* Create strip: labels inline so every control shares one baseline; the
          former hints live on `title` instead of pushing the button out of line. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-solid border-line bg-panel-2 cut-tag cut-tag-edge px-3 py-2 mb-3">
        <label className="flex items-center gap-2" title={t("maxUsesHint")}>
          <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-txt-muted whitespace-nowrap">
            {t("maxUsesLabel")}
          </span>
          <Input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="w-[80px] py-[5px] px-[9px] text-[13px]"
          />
        </label>

        <label className="flex items-center gap-2" title={t("expiresHint")}>
          <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-txt-muted whitespace-nowrap">
            {t("expiresLabel")}
          </span>
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-[200px] py-[5px] px-[9px] text-[13px]"
          />
        </label>

        <Button
          variant="pri"
          size="sm"
          icon="plus"
          loading={creating}
          onClick={create}
          className="ml-auto"
        >
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
        <div className="border border-solid border-line bg-panel-2 cut-tag cut-tag-edge divide-y divide-line">
          {rows.map((i) => (
            <div key={i.code} className="flex items-center gap-2 px-3 py-1.5">
              <span
                className={cn("w-[7px] h-[7px] shrink-0 rotate-45", isLive(i) ? "bg-ok" : "bg-txt-dim")}
                title={isLive(i) ? t("live") : t("spent")}
              />
              <code className="font-mono text-sm truncate">{i.code}</code>
              <span className="font-mono text-[11px] text-txt-dim whitespace-nowrap">
                {t("uses", { used: i.uses, max: i.maxUses })}
              </span>

              <span className="flex-1" />

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
