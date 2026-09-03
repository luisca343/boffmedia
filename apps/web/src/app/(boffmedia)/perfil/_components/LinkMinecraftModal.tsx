"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Modal, Spinner, toast } from "@boffmedia/ui"
import { AuthService } from "@/services/api/boffmedia/authService"

type Phase = "starting" | "waiting" | "done" | "error"

/**
 * Links a Minecraft account by running Microsoft's device-code flow.
 *
 * The browser drives the polling: each call asks Microsoft once and returns, so
 * a ten-minute wait never parks a server worker. The Microsoft device code
 * itself stays on the API, keyed to the session — it is a bearer credential for
 * the whole flow and has no business reaching the browser.
 */
export function LinkMinecraftModal({
  open,
  onClose,
  onLinked,
}: {
  open: boolean
  onClose: () => void
  onLinked: () => void
}) {
  const t = useTranslations("profile.linkMc")
  const [phase, setPhase] = React.useState<Phase>("starting")
  const [code, setCode] = React.useState<string | null>(null)
  const [uri, setUri] = React.useState<string>("https://www.microsoft.com/link")
  const [error, setError] = React.useState<string | null>(null)

  // The effect below must depend on `open` and NOTHING else. `onLinked` is an
  // inline arrow from the parent and `t` is re-created per render, so leaving
  // either in the deps restarts the whole device flow on any parent re-render —
  // and `SessionProvider` refetches on window focus, i.e. at the exact moment
  // the player returns from the Microsoft tab. That tore down the flow they had
  // just approved and issued a fresh code, so linking could never complete.
  const onLinkedRef = React.useRef(onLinked)
  onLinkedRef.current = onLinked
  const tRef = React.useRef(t)
  tRef.current = t

  React.useEffect(() => {
    if (!open) return
    const t = tRef.current
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const fail = (msg: string) => {
      if (cancelled) return
      setError(msg)
      setPhase("error")
    }

    const poll = (intervalMs: number) => {
      timer = setTimeout(async () => {
        if (cancelled) return
        try {
          const res = await AuthService.pollMinecraftLink()
          if (cancelled) return
          if (!res.success || !res.data) return fail(res.error ?? t("failed"))

          if (res.data.status === "pending") return poll(intervalMs)
          if (res.data.status === "linked") {
            setPhase("done")
            toast.success(t("linked", { name: res.data.username ?? "" }))
            onLinkedRef.current()
            return
          }
          fail(res.data.status === "declined" ? t("declined") : t("expired"))
        } catch (e) {
          fail(e instanceof Error ? e.message : t("failed"))
        }
      }, intervalMs)
    }

    const start = async () => {
      setPhase("starting")
      setError(null)
      setCode(null)
      try {
        const res = await AuthService.startMinecraftLink()
        if (cancelled) return
        if (!res.success || !res.data) return fail(res.error ?? t("failed"))
        setCode(res.data.userCode)
        setUri(res.data.verificationUri)
        setPhase("waiting")
        poll(Math.max(2, res.data.intervalSeconds) * 1000)
      } catch (e) {
        fail(e instanceof Error ? e.message : t("failed"))
      }
    }

    void start()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title={t("title")}>
      <div className="grid gap-4">
        <p className="font-body text-[0.875rem]/[1.6] text-txt-muted text-pretty">{t("lead")}</p>

        {phase === "starting" && (
          <div className="flex items-center justify-center gap-2 py-6">
            <Spinner />
          </div>
        )}

        {phase === "waiting" && code && (
          <>
            <div className="border border-solid border-line bg-panel-2 p-5 text-center cut-tag cut-tag-edge">
              <div className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-txt-dim">
                {t("codeLabel")}
              </div>
              <div className="mt-2 font-display text-[2.125rem]/[1] font-extrabold tracking-[0.12em] text-txt">
                {code}
              </div>
            </div>
            <Button
              variant="pri"
              icon="external"
              onClick={() => window.open(uri, "_blank", "noopener")}
            >
              {t("openMicrosoft")}
            </Button>
            <p className="inline-flex items-center gap-2 font-mono text-[0.6875rem] text-txt-dim">
              <Spinner /> {t("waiting")}
            </p>
          </>
        )}

        {phase === "done" && (
          <p className="inline-flex items-center gap-2 text-ok">
            <Icon name="check" size={16} /> {t("doneShort")}
          </p>
        )}

        {phase === "error" && <p className="text-bad text-[0.875rem]">{error}</p>}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            {phase === "done" ? t("close") : t("cancel")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
