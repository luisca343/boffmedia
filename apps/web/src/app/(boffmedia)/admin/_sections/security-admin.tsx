"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Spinner, toast } from "@boffmedia/ui"
import {
  TwoFactorService,
  type TwoFactorStatus,
} from "@/services/api/boffmedia/twoFactorService"
import { AvAlert, AvKpi, AvKpis, AvPanel, AvSectionHead } from "../_components/ui/av-kit"

/**
 * The account's own security state, inside the console the account already
 * lives in.
 *
 * There is no "enable" button and no "disable" button on purpose. Enrolment is
 * MANDATORY for an admin and happens at sign-in — `/auth/login` never mints a
 * session for an admin account without it — so by the time this page renders,
 * the factor exists. What is genuinely useful here is the one thing sign-in
 * cannot offer: printing a fresh set of backup codes when the old ones have been
 * spent or lost.
 */
export function SecurityAdmin() {
  const t = useTranslations("admin.twoFactor")
  const [status, setStatus] = React.useState<TwoFactorStatus | null>(null)
  const [code, setCode] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [freshCodes, setFreshCodes] = React.useState<string[] | null>(null)

  const reload = React.useCallback(async () => {
    const res = await TwoFactorService.status()
    if (res.success && res.data) setStatus(res.data)
  }, [])

  React.useEffect(() => {
    void reload()
  }, [reload])

  const regenerate = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await TwoFactorService.regenerateBackupCodes({ code: code.trim() })
      if (!res.success || !res.data) {
        setError(res.userMessage ?? t("invalidCode"))
        return
      }
      // Shown once. Regenerating invalidated every previous code, so an admin
      // who navigates away without copying these has to regenerate again.
      setFreshCodes(res.data.backup_codes)
      setCode("")
      toast({ tone: "ok", title: t("codesRegenerated") })
      await reload()
    } finally {
      setBusy(false)
    }
  }

  if (!status) return <Spinner />

  return (
    <div className="flex flex-col gap-5">
      <AvSectionHead title={t("sectionTitle")} desc={t("sectionDesc")} />

      <AvKpis>
        <AvKpi label={t("kpiRequired")} value={status.required ? t("yes") : t("no")} />
        <AvKpi label={t("kpiEnrolled")} value={status.enrolled ? t("yes") : t("no")} />
        <AvKpi
          label={t("kpiBackupCodes")}
          value={String(status.backup_codes_remaining)}
        />
      </AvKpis>

      {status.required && !status.enrolled && (
        <AvAlert tone="warning">{t("notEnrolledWarning")}</AvAlert>
      )}

      {status.backup_codes_remaining <= 2 && status.enrolled && (
        <AvAlert tone="warning">{t("lowBackupCodes")}</AvAlert>
      )}

      <AvPanel title={t("regenerateTitle")}>
        <p className="mb-3 text-sm text-txt-muted">{t("regenerateLead")}</p>
        <form onSubmit={regenerate} className="flex flex-col gap-3 max-w-sm">
          <Field label={t("codeLabel")} error={error ?? undefined}>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
            />
          </Field>
          <Button
            type="submit"
            variant="pri"
            disabled={busy || !status.enrolled || code.trim().length !== 6}
          >
            {t("regenerateSubmit")}
          </Button>
        </form>

        {freshCodes && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-txt-muted">{t("codesLead")}</p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-[0.95rem] sm:grid-cols-5">
              {freshCodes.map((c) => (
                <li key={c} className="border border-line-2 px-3 py-2 text-center">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </AvPanel>
    </div>
  )
}
