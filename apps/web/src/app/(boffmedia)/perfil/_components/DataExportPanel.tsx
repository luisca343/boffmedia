"use client"

import * as React from "react"
import { useFormatter, useTranslations } from "next-intl"
import { Banner, Button, Panel, toast } from "@boffmedia/ui"
import { useApiError } from "@/hooks/useApiError"
import { useVisiblePoll } from "@/hooks/useVisiblePoll"
import {
  DataExportService,
  type DataExportStatus,
} from "@/services/api/boffmedia/dataExportService"

/** How often the browser asks whether the archive is ready. */
const POLL_MS = 5000

/**
 * "Download my data" (GDPR art. 15 / 20).
 *
 * The archive is built in the background — it reads about ninety tables — so
 * the panel has three states rather than one button: idle, preparing, ready.
 * Preparing is the one that matters: without it, a request that returns 201 and
 * then nothing reads as a button that does not work, and the user presses it
 * again every few seconds.
 *
 * `useVisiblePoll`, not a bare interval: a profile tab left open in the
 * background would otherwise keep asking forever, and polling stops being useful
 * the moment nobody is looking at it.
 */
export function DataExportPanel() {
  const t = useTranslations("profile.dataExport")
  const format = useFormatter()
  const apiError = useApiError()

  const [state, setState] = React.useState<DataExportStatus | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const refresh = React.useCallback(async () => {
    const res = await DataExportService.status()
    if (!res.error) setState(res.data ?? null)
    setLoaded(true)
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const preparing = state?.status === "pending"
  useVisiblePoll(refresh, POLL_MS, preparing)

  const onRequest = async () => {
    setBusy(true)
    try {
      const res = await DataExportService.request()
      if (res.error) {
        // The cooldown refusal arrives here as a coded error, so the user is
        // told how long to wait rather than that something went wrong.
        toast.error(apiError(res.error, t("failed")))
        return
      }
      setState(res.data ?? null)
      toast.success(t("queued"))
    } finally {
      setBusy(false)
    }
  }

  const onDownload = async () => {
    if (!state) return
    setBusy(true)
    try {
      await DataExportService.download(state.id)
    } catch {
      toast.error(t("downloadFailed"))
      // The window may simply have closed while the tab sat open.
      void refresh()
    } finally {
      setBusy(false)
    }
  }

  const ready = state?.status === "ready"
  const expired = state?.status === "expired"
  const failed = state?.status === "failed"

  return (
    <Panel title={t("title")}>
      <p className="mb-4 font-body text-[0.9375rem]/[1.6] text-txt-muted text-pretty">
        {t("lead")}
      </p>
      <p className="mb-5 font-body text-[0.8125rem]/[1.55] text-txt-dim text-pretty">
        {t("scope")}
      </p>

      {preparing && (
        <Banner tone="info" icon="clock" title={t("preparingTitle")} className="mb-4">
          {t("preparingBody")}
        </Banner>
      )}

      {failed && (
        <Banner tone="error" title={t("failedTitle")} className="mb-4">
          {t("failedBody")}
        </Banner>
      )}

      {expired && (
        <Banner tone="warn" title={t("expiredTitle")} className="mb-4">
          {t("expiredBody")}
        </Banner>
      )}

      {ready && state.expiresAt && (
        <Banner tone="success" icon="check" title={t("readyTitle")} className="mb-4">
          {t("readyBody", {
            date: format.dateTime(new Date(state.expiresAt), {
              dateStyle: "long",
            }),
          })}
        </Banner>
      )}

      <div className="flex flex-wrap gap-2">
        {ready && (
          <Button variant="pri" icon="download" loading={busy} onClick={onDownload}>
            {t("download")}
          </Button>
        )}
        <Button
          variant={ready ? "ghost" : "pri"}
          icon="database"
          loading={busy && !ready}
          // Disabled while a build is in flight: a second request would be
          // answered with the same row anyway, and a button that appears to do
          // nothing is worse than one that says why it cannot.
          disabled={!loaded || preparing}
          onClick={onRequest}
        >
          {ready ? t("requestAgain") : t("request")}
        </Button>
      </div>
    </Panel>
  )
}
