"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Modal, RadioGroup, Textarea, toast } from "@boffmedia/ui"
import {
  ModerationService,
  REPORT_REASONS,
  type ReportableContentType,
  type ReportReason,
} from "@/services/api/boffmedia/moderationService"

/**
 * "Report this" for any user-generated content, anywhere.
 *
 * It lives in `components/shared/` rather than beside the forum because it is
 * deliberately surface-agnostic: the only thing it knows about its target is
 * the `(contentType, contentId)` pair the API keys reports on, so a new UGC
 * surface adopts reporting by rendering this — no new component, no new
 * endpoint.
 *
 * The dialog always closes on a "thank you", never on a verdict. Telling the
 * reporter what happened to the target is how a report button becomes a way to
 * probe moderation; saying nothing at all is what makes people stop reporting.
 * "We have it" is the line between the two.
 */
export function ReportButton({
  contentType,
  contentId,
  className,
  size = "sm",
}: {
  contentType: ReportableContentType
  contentId: string | number
  className?: string
  size?: "sm" | "md"
}) {
  const t = useTranslations("common.moderation")
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState<ReportReason>("spam")
  const [detail, setDetail] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const close = () => {
    setOpen(false)
    setError(null)
    setDetail("")
    setReason("spam")
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await ModerationService.report({
        contentType,
        contentId: String(contentId),
        reason,
        detail: detail.trim() || undefined,
      })
      if (!res.success) {
        setError(res.userMessage ?? t("failed"))
        return
      }
      // A repeat report from the same person updates theirs instead of adding
      // a second one, and saying so is the honest acknowledgement — otherwise
      // they wonder whether the first one landed.
      toast({
        tone: "ok",
        title: res.data?.duplicate ? t("updatedTitle") : t("receivedTitle"),
        msg: t("receivedBody"),
      })
      close()
    } catch {
      setError(t("failed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        icon="alert"
        className={className}
        onClick={() => setOpen(true)}
      >
        {t("report")}
      </Button>

      <Modal
        open={open}
        onClose={close}
        title={t("dialogTitle")}
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? t("sending") : t("send")}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-[0.8rem] text-muted">{t("dialogLead")}</p>

        <RadioGroup
          value={reason}
          onChange={(value) => setReason(value as ReportReason)}
          ariaLabel={t("reasonLabel")}
          options={REPORT_REASONS.map((value) => ({
            value,
            label: t(`reason.${value}`),
          }))}
        />

        <Field label={t("detailLabel")} hint={t("detailHint")} className="mt-3">
          <Textarea
            rows={3}
            maxLength={500}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
          />
        </Field>

        {error ? (
          <p className="mt-2 text-[0.8rem] font-medium text-bad">{error}</p>
        ) : null}
      </Modal>
    </>
  )
}
