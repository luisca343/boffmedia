"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button, Field, Input } from "@boffmedia/ui"
import { AuthService } from "@/services/api/boffmedia/authService"
import { AuthShell } from "./AuthShell"
import { ResendVerificationButton } from "./ResendVerificationButton"

type Status = "verifying" | "ok" | "err" | "missing"

export function VerifyEmailScreen() {
  const t = useTranslations("auth")
  const router = useRouter()
  const token = useSearchParams().get("token") ?? ""
  const [status, setStatus] = React.useState<Status>(token ? "verifying" : "missing")
  const [email, setEmail] = React.useState("")
  const [sent, setSent] = React.useState(false)
  // Consume the (single-use) token exactly once, even under StrictMode's
  // double-invoked effects.
  const ran = React.useRef(false)

  React.useEffect(() => {
    if (!token || ran.current) return
    ran.current = true
    AuthService.verifyEmail(token)
      .then((res) => setStatus(res.success ? "ok" : "err"))
      .catch(() => setStatus("err"))
  }, [token])

  const message =
    status === "verifying"
      ? { text: t("verify.verifying"), tone: "text-txt-muted" }
      : status === "ok"
        ? { text: t("verify.success"), tone: "text-success" }
        : status === "missing"
          ? { text: t("verify.missingToken"), tone: "text-danger" }
          : { text: t("verify.error"), tone: "text-danger" }

  // The link expires in 24h, so "invalid or expired" is the state most people
  // actually land in — offering a fresh one here is the difference between a
  // dead end and one more click. The address is asked for rather than read from
  // the session: a stale link is just as likely to be opened signed out.
  const canResend = status === "err" || status === "missing"

  return (
    <AuthShell title={t("verify.title")}>
      <div className="flex flex-col gap-[15px]">
        <p className={`font-body text-[14px]/[1.55] not-italic normal-case ${message.tone}`}>
          {message.text}
        </p>

        {canResend && (
          <div className="flex flex-col gap-[11px]">
            <p className="font-body text-[13.5px]/[1.5] not-italic normal-case text-txt-muted">
              {sent ? t("resend.sentLead") : t("verify.resendLead")}
            </p>
            <Field label={t("fields.email")}>
              <Input
                type="email"
                autoComplete="email"
                placeholder={t("fields.emailPh")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <ResendVerificationButton
              email={email}
              variant="pri"
              className="w-full"
              onSent={() => setSent(true)}
            />
          </div>
        )}

        {status !== "verifying" && (
          <Button
            variant={canResend ? "ghost" : "pri"}
            className="w-full"
            onClick={() => router.replace("/entrar")}
          >
            {t("verify.goLogin")}
          </Button>
        )}
      </div>
    </AuthShell>
  )
}
