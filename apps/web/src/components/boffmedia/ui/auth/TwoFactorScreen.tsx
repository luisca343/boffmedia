"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Spinner, toast } from "@boffmedia/ui"
import { TwoFactorService, type TwoFactorEnrolment } from "@/services/api/boffmedia/twoFactorService"
import type { TwoFactorSessionUpdate } from "@/features/twoFactorSession"
import { AuthShell } from "./AuthShell"

type Step = "loading" | "enrol" | "codes" | "verify"

/**
 * The second half of an admin sign-in.
 *
 * Reached only through `TwoFactorGate`, which sends every session carrying
 * `twoFactorPending` here. The credential in play is the challenge token on the
 * session — not a session token, because there is no session yet: it
 * authenticates `/auth/2fa/challenge/*` and nothing else.
 *
 * Two entry states, chosen by whether the account already has a factor:
 *  - not enrolled → the QR, then the backup codes, then in. Enrolment is not
 *    skippable; an admin without a second factor never receives a session.
 *  - enrolled → one code (or one backup code) and in.
 *
 * Finishing means calling NextAuth's `update()` with the session the API minted.
 * The page never fabricates a token — it relays exactly what came back.
 */
export function TwoFactorScreen() {
  const t = useTranslations("auth.twoFactor")
  const router = useRouter()
  const params = useSearchParams()
  const { data: session, status, update } = useSession()
  const redirect = params.get("redirect") || "/"

  const [step, setStep] = React.useState<Step>("loading")
  const [enrolment, setEnrolment] = React.useState<TwoFactorEnrolment | null>(null)
  const [backupCodes, setBackupCodes] = React.useState<string[]>([])
  // The session confirming enrolment already returned. Held rather than promoted
  // immediately so the backup codes get a screen of their own — they are shown
  // once and never again.
  const [pendingSession, setPendingSession] =
    React.useState<TwoFactorSessionUpdate["twoFactor"]>(undefined)
  const [code, setCode] = React.useState("")
  const [useBackup, setUseBackup] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const challengeToken = session?.user?.challengeToken
  const enrolled = session?.user?.twoFactorEnrolled

  // Guard against a stale visit: if there is nothing pending, this page has no
  // job and would otherwise sit on a spinner forever.
  React.useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.twoFactorPending || !challengeToken) {
      router.replace(redirect)
    }
  }, [status, session, challengeToken, redirect, router])

  // Start (or restart) enrolment as soon as we know the account has no factor.
  React.useEffect(() => {
    if (!challengeToken || enrolled === undefined) return
    if (enrolled) {
      setStep("verify")
      return
    }
    let cancelled = false
    void TwoFactorService.startEnrolment(challengeToken).then((res) => {
      if (cancelled) return
      if (!res.success || !res.data) {
        setError(res.userMessage ?? t("errors.enrolmentFailed"))
        setStep("enrol")
        return
      }
      setEnrolment(res.data)
      setStep("enrol")
    })
    return () => {
      cancelled = true
    }
  }, [challengeToken, enrolled, t])

  /** Hand the freshly minted session to NextAuth, then leave. */
  const promote = React.useCallback(
    async (payload: TwoFactorSessionUpdate["twoFactor"]) => {
      await update({ twoFactor: payload } satisfies TwoFactorSessionUpdate)
      router.replace(redirect)
    },
    [update, router, redirect],
  )

  const submitEnrolment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!challengeToken) return
    setBusy(true)
    setError(null)
    const res = await TwoFactorService.confirmEnrolment(challengeToken, code.trim())
    setBusy(false)
    if (!res.success || !res.data) {
      setError(res.userMessage ?? t("errors.invalidCode"))
      return
    }
    // The codes are shown ONCE — the server keeps only their hashes — so the
    // session is not promoted until the admin has clicked past this screen.
    const { backup_codes: codes, ...minted } = res.data
    setBackupCodes(codes)
    setPendingSession(minted)
    setCode("")
    setStep("codes")
  }

  const submitVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!challengeToken) return
    setBusy(true)
    setError(null)
    const res = await TwoFactorService.verify(
      challengeToken,
      useBackup ? { backupCode: code.trim() } : { code: code.trim() },
    )
    setBusy(false)
    if (!res.success || !res.data) {
      setError(res.userMessage ?? t("errors.invalidCode"))
      return
    }
    await promote(res.data)
  }

  const finishEnrolment = async () => {
    // Confirming already proved the secret, so no second code is asked for and
    // no backup code is spent: the API returned the session alongside them.
    if (!pendingSession) {
      toast({ tone: "bad", title: t("errors.generic") })
      return
    }
    setBusy(true)
    await promote(pendingSession)
  }

  if (step === "loading") {
    return (
      <AuthShell title={t("title")}>
        <Spinner />
      </AuthShell>
    )
  }

  if (step === "codes") {
    return (
      <AuthShell title={t("codesTitle")} subtitle={t("codesLead")}>
        <ul className="grid grid-cols-2 gap-2 font-mono text-[0.95rem]">
          {backupCodes.map((c) => (
            <li key={c} className="border border-line-2 px-3 py-2 text-center">
              {c}
            </li>
          ))}
        </ul>
        <Button variant="pri" onClick={finishEnrolment} disabled={busy}>
          {t("codesSaved")}
        </Button>
      </AuthShell>
    )
  }

  if (step === "enrol") {
    return (
      <AuthShell title={t("enrolTitle")} subtitle={t("enrolLead")}>
        {enrolment ? (
          <>
            {/* xss-ok: the QR arrives from the API as an SVG string so no client
                needs a QR encoder. Server-generated markup, never user content. */}
            <div
              className="mx-auto w-[12rem] bg-white p-2"
              dangerouslySetInnerHTML={{ __html: enrolment.qr_svg }}
            />
            <p className="text-center font-mono text-[0.8rem] text-txt-muted break-all">
              {enrolment.secret}
            </p>
          </>
        ) : (
          <Spinner />
        )}
        <form onSubmit={submitEnrolment} className="flex flex-col gap-3">
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
          <Button type="submit" variant="pri" disabled={busy || !enrolment}>
            {t("enrolSubmit")}
          </Button>
        </form>
        <CancelSignIn label={t("cancel")} />
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t("title")} subtitle={t("lead")}>
      <form onSubmit={submitVerify} className="flex flex-col gap-3">
        <Field
          label={useBackup ? t("backupLabel") : t("codeLabel")}
          error={error ?? undefined}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode={useBackup ? "text" : "numeric"}
            autoComplete="one-time-code"
            maxLength={useBackup ? 32 : 6}
            placeholder={useBackup ? "XXXXXXXXXX" : "123456"}
            autoFocus
          />
        </Field>
        <Button type="submit" variant="pri" disabled={busy || !code.trim()}>
          {t("submit")}
        </Button>
      </form>
      <Button
        variant="ghost"
        onClick={() => {
          setUseBackup((v) => !v)
          setCode("")
          setError(null)
        }}
      >
        {useBackup ? t("useAuthenticator") : t("useBackup")}
      </Button>
      <CancelSignIn label={t("cancel")} />
    </AuthShell>
  )
}

/** Abandoning the challenge has to destroy the pending session, or the gate
 *  bounces the browser straight back here. */
function CancelSignIn({ label }: { label: string }) {
  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/entrar" })}>
      {label}
    </Button>
  )
}
