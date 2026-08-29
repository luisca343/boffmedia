"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, toast } from "@boffmedia/ui"
import { AvSectionHead, AvJobPanel, AvMetric, AvMetrics, type AvJobStatus } from "../../_components/ui/av-kit"
import { PtcgpService } from "@/services/api/boffmedia/ptcgpService"

const POLLING_INTERVAL_MS = 2000

interface ProgressState {
  totalSets?: number
  doneSets?: number
  failedSets?: number
  message?: string
}

export function TcgpScraper() {
  const t = useTranslations("admin.tcgp")
  const [status, setStatus] = useState<AvJobStatus>("idle")
  const [progress, setProgress] = useState<ProgressState>({})

  const triggerFetch = async () => {
    setStatus("running")
    setProgress({})
    try {
      await PtcgpService.fetchAndStoreSeries()
      await PtcgpService.fetchAndStoreSetsForSeries("tcgp")
      const results = await PtcgpService.fetchAndStoreAllCardsForSeries("tcgp")
      const successful = results.data?.filter((r) => !r.error) ?? []
      const failed = results.data?.filter((r) => r.error) ?? []
      setProgress({
        totalSets: results.data?.length ?? 0,
        doneSets: successful.length,
        failedSets: failed.length,
      })
      setStatus("done")
      const msg = t("processed", { done: successful.length, total: results.data?.length ?? 0 })
      toast({ msg, tone: "ok" })
    } catch (error) {
      setStatus("error")
      const message = error instanceof Error ? error.message : t("error")
      setProgress({ message })
      toast({ msg: message, tone: "bad" })
    }
  }

  return (
    <div className="max-w-2xl">
      <AvSectionHead title={t("title")} desc={t("desc")} />

      <AvJobPanel
        title={t("panel")}
        status={status}
        progress={
          status === "running"
            ? { value: progress.doneSets ?? 0, max: progress.totalSets ?? 0, label: `${progress.doneSets ?? 0}/${progress.totalSets ?? 0}` }
            : undefined
        }
        actions={
          <>
            <Button variant="pri" icon="refresh" loading={status === "running"} disabled={status === "running"} onClick={triggerFetch}>
              {status === "running" ? t("processing") : t("load")}
            </Button>
            {status === "done" && (
              <Button variant="ghost" onClick={() => setStatus("idle")}>
                {t("reset")}
              </Button>
            )}
          </>
        }
        meta={
          status === "done" && progress.totalSets ? (
            <AvMetrics>
              <AvMetric value={progress.doneSets ?? 0} label="OK" tone="pos" />
              {progress.failedSets ? <AvMetric value={progress.failedSets} label="Failed" tone="neg" /> : null}
            </AvMetrics>
          ) : null
        }
      >
        {progress.message && <p className="text-sm text-txt-muted">{progress.message}</p>}
      </AvJobPanel>
    </div>
  )
}
