"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ApiErrorCode } from "@boffmedia/shared/error-codes"
import { Banner, Button, Field, Icon, Input, Panel, Spinner, toast } from "@boffmedia/ui"
import { ResendVerificationButton } from "@/components/boffmedia/ui/auth"
import { useBoffSession } from "@/services/useBoffSession"
import {
  DesktopAuthService,
  type DeviceRequest,
} from "@/services/api/boffmedia/desktopAuthService"

type Phase = "code" | "confirm" | "approved" | "denied" | "already-approved" | "already-denied"

/**
 * The website half of the launcher's device-authorization flow.
 *
 * The launcher never sees a password: the player is already signed in here, so
 * approving a short code is all the proof either side needs. Approving requires
 * a verified email, which is the only anti-abuse gate on the flow — opening the
 * launcher needs no paid Minecraft account.
 */
export function AuthorizeAppView() {
  const t = useTranslations("appAuth")
  const searchParams = useSearchParams()
  const { session } = useBoffSession()

  const [code, setCode] = React.useState(searchParams.get("code") ?? "")
  const [request, setRequest] = React.useState<DeviceRequest | null>(null)
  const [phase, setPhase] = React.useState<Phase>("code")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // Approving is the one action here gated on a verified email. The API says so
  // with AUTH_EMAIL_NOT_VERIFIED, which is what lets this screen offer a resend
  // in place of the dead end the bare message used to be.
  const [needsVerification, setNeedsVerification] = React.useState(false)

  const lookup = React.useCallback(
    async (raw: string) => {
      const value = raw.trim()
      if (!value) return
      setBusy(true)
      setError(null)
      try {
        const res = await DesktopAuthService.describe(value)
        if (res.success && res.data) {
          setRequest(res.data)
          // A code that is already decided cannot be decided again — offering
          // Approve/Deny on it only produces a 400.
          if (res.data.status === "approved") setPhase("already-approved")
          else if (res.data.status === "denied") setPhase("already-denied")
          else setPhase("confirm")
        } else {
          setError(res.userMessage ?? res.error ?? t("notFound"))
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t("notFound"))
      } finally {
        setBusy(false)
      }
    },
    [t],
  )

  // A code arriving in the URL means the launcher opened this page itself;
  // looking it up straight away saves the player retyping what they can see.
  const prefilled = searchParams.get("code")
  React.useEffect(() => {
    if (prefilled && session?.user) void lookup(prefilled)
  }, [prefilled, session?.user, lookup])

  const decide = async (approve: boolean) => {
    setBusy(true)
    setError(null)
    try {
      const res = approve
        ? await DesktopAuthService.approve(code)
        : await DesktopAuthService.deny(code)
      if (!res.success) {
        setNeedsVerification(res.code === ApiErrorCode.AUTH_EMAIL_NOT_VERIFIED)
        setError(res.userMessage ?? res.error ?? t("failed"))
        return
      }
      setNeedsVerification(false)
      setPhase(approve ? "approved" : "denied")
      if (approve) toast.success(t("approvedToast"))
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
          {!session?.user ? (
            <>
              <p className="mb-5 font-body text-[15px]/[1.6] text-txt-muted text-pretty">
                {t("loginLead")}
              </p>
              <Button variant="pri" icon="user" href="/entrar" className="w-full">
                {t("login")}
              </Button>
            </>
          ) : phase === "approved" ? (
            <div className="grid gap-3 py-4 text-center">
              <Icon name="check" size={34} className="mx-auto text-ok" />
              <p className="font-display text-[20px] font-bold uppercase">{t("approvedTitle")}</p>
              <p className="font-body text-[14px] text-txt-muted">{t("approvedLead")}</p>
            </div>
          ) : phase === "denied" ? (
            <div className="grid gap-3 py-4 text-center">
              <Icon name="x" size={34} className="mx-auto text-txt-dim" />
              <p className="font-display text-[20px] font-bold uppercase">{t("deniedTitle")}</p>
              <p className="font-body text-[14px] text-txt-muted">{t("deniedLead")}</p>
            </div>
          ) : phase === "already-approved" || phase === "already-denied" ? (
            <div className="grid gap-3 py-4 text-center">
              <Icon
                name={phase === "already-approved" ? "check" : "x"}
                size={34}
                className={phase === "already-approved" ? "mx-auto text-ok" : "mx-auto text-txt-dim"}
              />
              <p className="font-display text-[20px] font-bold uppercase">
                {t(phase === "already-approved" ? "alreadyApprovedTitle" : "alreadyDeniedTitle")}
              </p>
              <p className="font-body text-[14px] text-txt-muted">
                {t(phase === "already-approved" ? "alreadyApprovedLead" : "alreadyDeniedLead")}
              </p>
            </div>
          ) : phase === "confirm" && request ? (
            <div className="grid gap-4">
              <p className="font-body text-[15px]/[1.6] text-txt-muted text-pretty">
                {t("confirmLead")}
              </p>
              <div className="border border-solid border-line bg-panel-2 p-4 cut-tag cut-tag-edge">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-txt-dim">
                  {t("client")}
                </div>
                <div className="mt-1 font-medium text-txt">
                  {request.clientLabel ?? t("unknownClient")}
                </div>
                <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-txt-dim">
                  {t("codeLabel")}
                </div>
                <div className="mt-1 font-display text-[26px]/[1] font-extrabold tracking-[0.12em]">
                  {request.userCode}
                </div>
              </div>

              {needsVerification ? (
                <Banner
                  tone="warn"
                  title={t("verifyTitle")}
                  actions={
                    session.user.email ? (
                      <ResendVerificationButton email={session.user.email} size="sm" />
                    ) : undefined
                  }
                >
                  {t("verifyLead")}
                </Banner>
              ) : (
                error && <p className="text-bad text-[14px]">{error}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" loading={busy} onClick={() => decide(false)}>
                  {t("deny")}
                </Button>
                <Button variant="pri" icon="check" loading={busy} onClick={() => decide(true)}>
                  {t("approve")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <p className="font-body text-[15px]/[1.6] text-txt-muted text-pretty">{t("lead")}</p>
              <Field label={t("codeLabel")} hint={t("codeHint")} error={error ?? undefined}>
                <Input
                  value={code}
                  placeholder="K7QM-3BXR"
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void lookup(code)
                  }}
                />
              </Field>
              <Button
                variant="pri"
                loading={busy}
                disabled={!code.trim()}
                onClick={() => void lookup(code)}
                className="w-full"
              >
                {t("continue")}
              </Button>
              {busy && <Spinner />}
            </div>
          )}
        </Panel>
      </div>
    </main>
  )
}
