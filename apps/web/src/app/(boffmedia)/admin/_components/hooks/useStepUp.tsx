"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Modal } from "@boffmedia/ui"
import { TwoFactorService } from "@/services/api/boffmedia/twoFactorService"

/**
 * Asks for a fresh two-factor code and exchanges it for the step-up token the
 * publishing endpoints demand in `X-Step-Up-Token`.
 *
 * The prompt is a promise: a call site reads as
 *
 *   const token = await requestStepUp()
 *   if (!token) return            // the admin cancelled
 *   await Service.publish(id, token)
 *
 * so the existing handlers keep their shape and gain one guard clause. The token
 * is deliberately NOT cached between actions — it is short-lived on the server,
 * and holding it in module state would quietly turn "confirm each publish" into
 * "confirm once per session", which is the property being bought here.
 */
export function useStepUp() {
  const t = useTranslations("admin.twoFactor")
  const [open, setOpen] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // Held in a ref, not state: resolving is a one-shot side effect and must not
  // be lost to a re-render between opening the prompt and the admin typing.
  const resolveRef = React.useRef<((token: string | null) => void) | null>(null)

  const settle = React.useCallback((token: string | null) => {
    resolveRef.current?.(token)
    resolveRef.current = null
    setOpen(false)
    setCode("")
    setBusy(false)
    setError(null)
  }, [])

  const requestStepUp = React.useCallback(() => {
    setCode("")
    setError(null)
    setOpen(true)
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const submit = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setBusy(true)
      setError(null)
      try {
        const res = await TwoFactorService.stepUp({ code: code.trim() })
        if (!res.success || !res.data) {
          setError(res.userMessage ?? t("invalidCode"))
          setBusy(false)
          return
        }
        settle(res.data.step_up_token)
      } catch {
        setError(t("invalidCode"))
        setBusy(false)
      }
    },
    [code, settle, t],
  )

  const dialog = (
    <Modal
      open={open}
      // Closing the dialog any other way still has to resolve the promise, or
      // the caller awaits forever and its spinner never stops.
      onClose={() => settle(null)}
      title={t("stepUpTitle")}
      size="sm"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm text-txt-muted">{t("stepUpLead")}</p>
        <Field label={t("codeLabel")} error={error ?? undefined}>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => settle(null)}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={busy || code.trim().length !== 6}>
            {t("confirm")}
          </Button>
        </div>
      </form>
    </Modal>
  )

  return { requestStepUp, stepUpDialog: dialog }
}
