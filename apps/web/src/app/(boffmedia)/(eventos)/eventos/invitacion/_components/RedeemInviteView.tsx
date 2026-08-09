"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, Panel, toast } from "@boffmedia/ui"
import { useBoffSession } from "@/services/useBoffSession"
import { EventsService } from "@/services/api/boffmedia/eventsService"

/**
 * Redeeming an invitation is the only way into a private event, and event
 * membership is what entitles the account to the event's pack — so this page is
 * the entry point for "I was given a code, get me the pack".
 */
export function RedeemInviteView() {
  const t = useTranslations("events.invite")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useBoffSession()

  const [code, setCode] = React.useState(searchParams.get("code") ?? "")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const redeem = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      const res = await EventsService.redeemEventInvite(trimmed)
      if (res.success && res.data) {
        toast.success(t("joined"))
        router.push(`/eventos/${res.data.eventId}`)
        return
      }
      setError(res.error ?? t("failed"))
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="wrap pb-[90px] pt-6">
      <div className="mx-auto max-w-[520px]">
        <Panel title={t("title")}>
          <p className="mb-5 font-body text-[15px]/[1.6] text-txt-muted text-pretty">{t("lead")}</p>

          {!session?.user ? (
            <Button variant="pri" icon="user" href="/entrar" className="w-full">
              {t("loginFirst")}
            </Button>
          ) : (
            <div className="grid gap-4">
              <Field label={t("codeLabel")} hint={t("codeHint")} error={error ?? undefined}>
                <Input
                  value={code}
                  placeholder="A1B2C3D4E5F60718293A"
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") redeem()
                  }}
                />
              </Field>
              <Button
                variant="pri"
                icon="check"
                loading={busy}
                disabled={!code.trim()}
                onClick={redeem}
                className="w-full"
              >
                {t("redeem")}
              </Button>
            </div>
          )}

          <p className="mt-5 inline-flex items-center gap-2 font-mono text-[11px]/none uppercase tracking-[0.08em] text-txt-dim">
            <Icon name="info" size={13} /> {t("note")}
          </p>
        </Panel>
      </div>
    </main>
  )
}
