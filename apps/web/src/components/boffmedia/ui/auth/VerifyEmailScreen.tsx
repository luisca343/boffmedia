"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@boffmedia/ui"
import { AuthService } from "@/services/api/boffmedia/authService"
import { AuthShell } from "./AuthShell"

type Status = "verifying" | "ok" | "err" | "missing"

export function VerifyEmailScreen() {
  const t = useTranslations("auth")
  const router = useRouter()
  const token = useSearchParams().get("token") ?? ""
  const [status, setStatus] = React.useState<Status>(token ? "verifying" : "missing")
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

  return (
    <AuthShell kicker={t("verify.kicker")} title={t("verify.title")}>
      <div className="flex flex-col gap-[15px]">
        <p className={`font-body text-[14px]/[1.55] not-italic normal-case ${message.tone}`}>
          {message.text}
        </p>
        {status !== "verifying" && (
          <Button variant="pri" className="w-full" onClick={() => router.replace("/entrar")}>
            {t("verify.goLogin")}
          </Button>
        )}
      </div>
    </AuthShell>
  )
}
