"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Spinner } from "@boffmedia/ui"
import { AvSectionHead, AvPanel, AvPill } from "../ui/av-kit"
import { PtcgpService } from "@/services/api/boffmedia/ptcgpService"

type Step = "idle" | "series" | "sets" | "cards" | "done" | "error"

interface ProgressState {
  step: Step
  totalSets?: number
  doneSets?: number
  failedSets?: number
  message?: string
}

export function TcgpScraper() {
  const t = useTranslations("admin.tcgp")
  const [progress, setProgress] = useState<ProgressState>({ step: "idle" })
  const busy = progress.step === "series" || progress.step === "sets" || progress.step === "cards"

  const triggerFetch = async () => {
    setProgress({ step: "series" })
    try {
      await PtcgpService.fetchAndStoreSeries()
      setProgress({ step: "sets" })
      await PtcgpService.fetchAndStoreSetsForSeries("tcgp")
      setProgress({ step: "cards" })
      const results = await PtcgpService.fetchAndStoreAllCardsForSeries("tcgp")
      const successful = results.data?.filter((r) => !r.error) ?? []
      const failed = results.data?.filter((r) => r.error) ?? []
      setProgress({
        step: "done",
        totalSets: results.data?.length ?? 0,
        doneSets: successful.length,
        failedSets: failed.length,
      })
    } catch (error) {
      setProgress({ step: "error", message: error instanceof Error ? error.message : undefined })
    }
  }

  const runningLabel =
    progress.step === "series" ? t("statusSeries") : progress.step === "sets" ? t("statusSets") : t("statusCards")

  return (
    <div className="max-w-2xl">
      <AvSectionHead title={t("title")} desc={t("desc")} />

      <AvPanel title={t("panel")} icon="database">
        {progress.step === "idle" ? (
          <p className="text-sm text-txt-muted">{t("idle")}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {busy && <Spinner size={14} className="text-accent shrink-0" />}
              {progress.step === "done" && <AvPill tone="green" icon="check">{t("done")}</AvPill>}
              {progress.step === "error" && <AvPill tone="rose" icon="alert">{t("error")}</AvPill>}
              {busy && <span className="text-sm font-medium text-accent">{runningLabel}</span>}
            </div>
            {progress.message && <p className="text-sm text-txt-muted">{progress.message}</p>}
            {progress.step === "done" && progress.totalSets != null && (
              <p className="text-xs text-txt-dim font-mono">
                {progress.failedSets && progress.failedSets > 0
                  ? t("processedFailed", { done: progress.doneSets ?? 0, total: progress.totalSets, failed: progress.failedSets })
                  : t("processed", { done: progress.doneSets ?? 0, total: progress.totalSets })}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="pri" icon={busy ? undefined : "refresh"} loading={busy} disabled={busy} onClick={triggerFetch}>
            {busy ? t("processing") : t("load")}
          </Button>
          {progress.step === "done" && <Button onClick={() => setProgress({ step: "idle" })}>{t("reset")}</Button>}
        </div>
      </AvPanel>
    </div>
  )
}
