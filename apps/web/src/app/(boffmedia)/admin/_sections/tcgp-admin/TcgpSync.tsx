"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, toast } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import {
  AvAlert,
  AvKpi,
  AvKpis,
  AvMetric,
  AvMetrics,
  AvPanel,
  AvPill,
  AvProgressBar,
  AvSectionHead,
  AvStickyBar,
  type AvJobStatus,
} from "../../_components/ui/av-kit"
import {
  PtcgpService,
  type TcgSyncEvent,
  type TcgSyncFailure,
  type TcgSyncStage,
  type TcgSyncStatus,
} from "@/services/api/boffmedia/ptcgpService"
import { SetSyncTable, type SetRunState } from "./SetSyncTable"
import {
  EMPTY_SELECTION,
  buildSyncPlan,
  incompleteSetIds,
  type TcgSyncSelection,
} from "./syncPlan"

const SERIES_ID = "tcgp"

interface JobState {
  status: AvJobStatus
  stages: TcgSyncStage[]
  stageStates: Partial<Record<TcgSyncStage, "pending" | "running" | "done" | "error">>
  setStates: Record<string, SetRunState>
  setsInRun: number
  stagesWithSets: number
  counts: { downloaded: number; updated: number; skipped: number; failed: number }
  failures: TcgSyncFailure[]
  durationMs: number
  currentLabel: string | null
}

const IDLE_JOB: JobState = {
  status: "idle",
  stages: [],
  stageStates: {},
  setStates: {},
  setsInRun: 0,
  stagesWithSets: 0,
  counts: { downloaded: 0, updated: 0, skipped: 0, failed: 0 },
  failures: [],
  durationMs: 0,
  currentLabel: null,
}

/**
 * Selective catalogue sync for TCG Pocket.
 *
 * Replaces the single "download everything" button: each data type is picked
 * independently, expansions are picked one by one, the run streams its progress,
 * and a set that fails is reported without taking the rest of the run with it.
 */
export function TcgpSync() {
  const t = useTranslations("admin.tcgp")

  const [status, setStatus] = useState<TcgSyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [selection, setSelection] = useState<TcgSyncSelection>({
    ...EMPTY_SELECTION,
    sets: true,
    cards: true,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [job, setJob] = useState<JobState>(IDLE_JOB)
  const abortRef = useRef<AbortController | null>(null)

  const running = job.status === "running"

  // ── status ────────────────────────────────────────────────────────────────

  const loadStatus = useCallback(
    async (keepSelection = true) => {
      setLoading(true)
      setStatusError(null)
      try {
        const res = await PtcgpService.getSyncStatus(SERIES_ID)
        const data = res.data
        if (!data) throw new Error(t("statusFailed"))
        setStatus(data)
        if (!keepSelection) return
        setSelectedIds((prev) => {
          // First load (or a wiped catalogue): pre-select what is not complete,
          // which is the common case — nobody re-imports finished expansions.
          if (prev.size === 0) {
            const incomplete = incompleteSetIds(data)
            return new Set(incomplete.length > 0 ? incomplete : data.sets.map((s) => s.id))
          }
          const alive = new Set(data.sets.map((s) => s.id))
          return new Set([...prev].filter((id) => alive.has(id)))
        })
      } catch (error) {
        setStatusError(error instanceof Error ? error.message : t("statusFailed"))
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  useEffect(() => {
    void loadStatus(true)
  }, [loadStatus])

  // Abort an in-flight run if the section unmounts, so the API stops too.
  useEffect(() => () => abortRef.current?.abort(), [])

  // ── selection ─────────────────────────────────────────────────────────────

  const sets = status?.sets ?? []
  const plan = useMemo(() => buildSyncPlan(status, selection, selectedIds), [status, selection, selectedIds])

  const toggleSet = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = () => setSelectedIds(new Set(sets.map((s) => s.id)))
  const selectNone = () => setSelectedIds(new Set())
  const selectIncomplete = () => setSelectedIds(new Set(incompleteSetIds(status)))

  const applyPreset = (preset: "full" | "update") => {
    if (preset === "full") {
      setSelection({ series: true, sets: true, cards: true, images: true, force: false })
      selectAll()
    } else {
      setSelection({ series: false, sets: true, cards: true, images: false, force: false })
      selectIncomplete()
    }
  }

  const setToggle = (key: keyof TcgSyncSelection) => (value: boolean) =>
    setSelection((prev) => ({ ...prev, [key]: value }))

  // ── run ───────────────────────────────────────────────────────────────────

  const start = async (overrideSetIds?: string[]) => {
    const setIds = overrideSetIds ?? [...selectedIds]
    const controller = new AbortController()
    abortRef.current = controller

    setJob({ ...IDLE_JOB, status: "running" })

    try {
      await PtcgpService.streamSync(
        {
          seriesId: SERIES_ID,
          series: selection.series,
          sets: selection.sets,
          cards: selection.cards,
          images: selection.images,
          force: selection.force,
          setIds,
        },
        (event) => setJob((prev) => reduceEvent(prev, event)),
        controller.signal,
      )
    } catch (error) {
      if (controller.signal.aborted) {
        setJob((prev) => ({ ...prev, status: "cancelled", currentLabel: null }))
      } else {
        const message = error instanceof Error ? error.message : t("error")
        setJob((prev) => ({
          ...prev,
          status: "error",
          currentLabel: null,
          failures: [...prev.failures, { stage: "series", scope: SERIES_ID, message }],
        }))
        toast({ msg: message, tone: "bad" })
      }
    } finally {
      abortRef.current = null
      // Counts changed under us — refresh so the table reflects what landed,
      // including after a cancel or a partial failure.
      void loadStatus(true)
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setJob((prev) => ({ ...prev, status: "cancelled", currentLabel: null }))
  }

  const retryFailed = () => {
    const failedSets = job.failures.filter((f) => f.stage === "cards" || f.stage === "images").map((f) => f.scope)
    const unique = [...new Set(failedSets)]
    if (unique.length === 0) return
    setSelectedIds(new Set(unique))
    void start(unique)
  }

  // ── derived ───────────────────────────────────────────────────────────────

  const totalSetSteps = job.setsInRun * Math.max(1, job.stagesWithSets)
  const doneSetSteps = Object.values(job.setStates).filter((s) => s.state !== "pending" && s.state !== "running").length
  const overallPct = totalSetSteps > 0 ? Math.round((doneSetSteps / totalSetSteps) * 100) : 0

  const imagesPct =
    status && status.imagesExpected > 0 ? Math.round((status.imagesPresent / status.imagesExpected) * 100) : 0
  const outdated = sets.filter((s) => s.state !== "ok").length
  const failedSetCount = new Set(
    job.failures.filter((f) => f.stage === "cards" || f.stage === "images").map((f) => f.scope),
  ).size

  return (
    <div className="max-w-5xl">
      <AvSectionHead
        title={t("title")}
        desc={t("desc")}
        actions={
          <Button variant="ghost" size="sm" icon="refresh" loading={loading} disabled={running} onClick={() => loadStatus(true)}>
            {t("refreshStatus")}
          </Button>
        }
      />

      {statusError && (
        <AvAlert tone="error" title={t("statusFailed")} className="mb-[18px]">
          {statusError}
        </AvAlert>
      )}

      {status && !status.remoteAvailable && (
        <AvAlert tone="warning" title={t("remoteDown")} className="mb-[18px]">
          {t("remoteDownHint")}
          {status.remoteError ? ` — ${status.remoteError}` : ""}
        </AvAlert>
      )}

      {/* ── 5. what is stored vs what is available ───────────────────────── */}
      <AvKpis>
        <AvKpi
          label={t("kpiSets")}
          value={`${status?.setsInDb ?? 0}/${status?.setsRemote || status?.setsInDb || 0}`}
          icon="layers"
          foot={outdated > 0 ? <AvPill tone="amber">{t("kpiOutdated", { count: outdated })}</AvPill> : <AvPill tone="green">{t("kpiUpToDate")}</AvPill>}
        />
        <AvKpi
          label={t("kpiCards")}
          value={(status?.cardsInDb ?? 0).toLocaleString()}
          icon="cards"
          foot={<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">{t("kpiOfRemote", { count: (status?.cardsRemote ?? 0).toLocaleString() })}</span>}
        />
        <AvKpi
          label={t("kpiImages")}
          value={`${imagesPct}%`}
          icon="camera"
          foot={
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">
              {t("readingImages", {
                have: (status?.imagesPresent ?? 0).toLocaleString(),
                total: (status?.imagesExpected ?? 0).toLocaleString(),
              })}
            </span>
          }
        />
        <AvKpi
          label={t("kpiPending")}
          value={outdated}
          icon="alert"
          live={outdated > 0}
          foot={<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">{t("kpiPendingFoot")}</span>}
        />
      </AvKpis>

      {/* ── 1 + 2 + 10. pick the data types ──────────────────────────────── */}
      <AvPanel
        title={t("whatTitle")}
        icon="database"
        aside={
          <span className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={running} onClick={() => applyPreset("update")}>
              {t("presetUpdate")}
            </Button>
            <Button variant="ghost" size="sm" disabled={running} onClick={() => applyPreset("full")}>
              {t("presetFull")}
            </Button>
          </span>
        }
      >
        <DataTypeRow
          label={t("typeSeries")}
          hint={t("typeSeriesHint")}
          checked={selection.series}
          onChange={setToggle("series")}
          disabled={running}
        />
        <DataTypeRow
          label={t("typeSets")}
          hint={t("typeSetsHint")}
          reading={status ? t("readingSets", { have: status.setsInDb, total: status.setsRemote || status.setsInDb }) : undefined}
          checked={selection.sets}
          onChange={setToggle("sets")}
          disabled={running}
        />
        <DataTypeRow
          label={t("typeCards")}
          hint={t("typeCardsHint")}
          reading={status ? t("readingCards", { have: status.cardsInDb, total: status.cardsRemote || status.cardsInDb }) : undefined}
          checked={selection.cards}
          onChange={setToggle("cards")}
          disabled={running}
        />
        <DataTypeRow
          label={t("typeImages")}
          hint={t("typeImagesHint")}
          reading={status ? t("readingImages", { have: status.imagesPresent, total: status.imagesExpected }) : undefined}
          checked={selection.images}
          onChange={setToggle("images")}
          disabled={running}
          warn={t("typeImagesWarn")}
        />
        <DataTypeRow
          label={t("typeForce")}
          hint={t("typeForceHint")}
          checked={selection.force}
          onChange={setToggle("force")}
          disabled={running}
        />
      </AvPanel>

      {/* ── 4. pick the expansions ───────────────────────────────────────── */}
      <AvPanel
        title={t("setsTitle")}
        icon="grid"
        aside={
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">
              {t("selectedCount", { count: selectedIds.size, total: sets.length })}
            </span>
            <Button variant="ghost" size="sm" disabled={running} onClick={selectAll}>
              {t("selectAll")}
            </Button>
            <Button variant="ghost" size="sm" disabled={running} onClick={selectIncomplete}>
              {t("selectIncomplete")}
            </Button>
            <Button variant="ghost" size="sm" disabled={running} onClick={selectNone}>
              {t("selectNone")}
            </Button>
          </span>
        }
      >
        {!selection.cards && !selection.images && (
          <p className="mb-3 text-[12.5px] text-txt-dim">{t("setsIgnored")}</p>
        )}
        <SetSyncTable
          sets={sets}
          selected={selectedIds}
          onToggle={toggleSet}
          disabled={running}
          runState={job.status === "idle" ? undefined : job.setStates}
        />
      </AvPanel>

      {/* ── 7. progress while running ────────────────────────────────────── */}
      {job.status !== "idle" && (
        <AvPanel
          title={t("runTitle")}
          icon="bolt"
          aside={<AvPill tone={job.status === "running" ? "accent" : job.status === "error" ? "rose" : job.status === "cancelled" ? "muted" : "green"}>{t(`run.${job.status}`)}</AvPill>}
          bodyClassName="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            {job.stages.map((stage) => (
              <AvPill
                key={stage}
                tone={
                  job.stageStates[stage] === "done"
                    ? "green"
                    : job.stageStates[stage] === "running"
                      ? "accent"
                      : job.stageStates[stage] === "error"
                        ? "rose"
                        : "default"
                }
                icon={job.stageStates[stage] === "done" ? "check" : undefined}
              >
                {t(`stage.${stage}`)}
              </AvPill>
            ))}
          </div>

          {totalSetSteps > 0 && (
            <AvProgressBar
              value={doneSetSteps}
              max={totalSetSteps}
              tone={job.status === "error" ? "rose" : job.status === "done" ? "green" : "accent"}
              label={`${overallPct}%`}
            />
          )}

          {job.currentLabel && (
            <p className="m-0 font-mono text-[11px] text-txt-muted">{job.currentLabel}</p>
          )}

          {/* ── 8. summary ─────────────────────────────────────────────── */}
          {(job.status === "done" || job.status === "cancelled" || job.status === "error") && (
            <AvMetrics>
              <AvMetric value={job.counts.downloaded} label={t("metricDownloaded")} tone="pos" />
              <AvMetric value={job.counts.updated} label={t("metricUpdated")} />
              <AvMetric value={job.counts.skipped} label={t("metricSkipped")} />
              <AvMetric value={job.counts.failed} label={t("metricFailed")} tone={job.counts.failed > 0 ? "neg" : undefined} />
              <AvMetric value={`${Math.round(job.durationMs / 1000)}s`} label={t("metricDuration")} />
            </AvMetrics>
          )}

          {/* ── 9. partial failures, retryable on their own ────────────── */}
          {job.failures.length > 0 && (
            <div className="border border-solid border-line-2 border-l-[3px] border-l-bad bg-panel-2 p-3">
              <p className="m-0 mb-2 font-display text-[13px] font-bold uppercase tracking-[0.03em]">
                {t("failuresTitle", { count: job.failures.length })}
              </p>
              <ul className="m-0 max-h-40 list-none overflow-y-auto p-0">
                {job.failures.map((f, i) => (
                  <li key={`${f.scope}-${i}`} className="flex gap-2 border-b border-dashed border-line py-1.5 last:border-b-0">
                    <AvPill tone="rose">{t(`stage.${f.stage}`)}</AvPill>
                    <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-txt-dim">{f.scope}</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-txt-muted" title={f.message}>
                      {f.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {running && (
              <Button variant="danger" size="sm" icon="x" onClick={cancel}>
                {t("cancel")}
              </Button>
            )}
            {!running && failedSetCount > 0 && (
              <Button variant="pri" size="sm" icon="refresh" onClick={retryFailed}>
                {t("retryFailed", { count: failedSetCount })}
              </Button>
            )}
            {!running && (
              <Button variant="ghost" size="sm" onClick={() => setJob(IDLE_JOB)}>
                {t("reset")}
              </Button>
            )}
          </div>
        </AvPanel>
      )}

      {/* ── 3 + 6. what will happen, then start it ───────────────────────── */}
      <AvStickyBar open={!running && !plan.empty}>
        <div className="min-w-0 flex-1">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.1em] text-txt-dim">{t("planTitle")}</p>
          <p className="m-0 text-[13px] text-txt">
            {t("planLine", {
              sets: plan.setsToProcess.length,
              cards: plan.cardsToFetch.toLocaleString(),
              images: selection.images ? plan.imagesToDownload.toLocaleString() : "0",
            })}
            {plan.setsSkipped.length > 0 && (
              <span className="text-txt-dim"> · {t("planSkipped", { count: plan.setsSkipped.length })}</span>
            )}
          </p>
        </div>
        <Button variant="pri" icon="download" onClick={() => start()} disabled={loading}>
          {t("startSync")}
        </Button>
      </AvStickyBar>

      {/* The sticky bar is fixed; keep the last panel clear of it. */}
      {!running && !plan.empty && <div className="h-20" aria-hidden />}
    </div>
  )
}

/* ---- one selectable data type ---------------------------------------------- */

function DataTypeRow({
  label,
  hint,
  reading,
  checked,
  onChange,
  disabled,
  warn,
}: {
  label: string
  hint: string
  reading?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  warn?: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 border-b border-dashed border-line py-2.5 last:border-b-0",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 accent-[var(--accent)]"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-txt">{label}</span>
          {reading && (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">{reading}</span>
          )}
          {warn && checked && (
            <AvPill tone="amber" icon="alert">
              {warn}
            </AvPill>
          )}
        </span>
        <span className="mt-0.5 block font-body text-[11.5px] leading-[1.4] text-txt-dim">{hint}</span>
      </span>
    </label>
  )
}

/* ---- event → state --------------------------------------------------------- */

/**
 * Folds one SSE frame into the job state. Kept pure so the stream handler is a
 * one-liner and the whole run is replayable from its events.
 */
function reduceEvent(prev: JobState, event: TcgSyncEvent): JobState {
  switch (event.type) {
    case "start": {
      const stagesWithSets = event.stages.filter((s) => s === "cards" || s === "images").length
      const setStates: Record<string, SetRunState> = {}
      for (const s of event.sets) setStates[s.id] = { state: "pending" }
      return {
        ...prev,
        stages: event.stages,
        stageStates: Object.fromEntries(event.stages.map((s) => [s, "pending" as const])),
        setStates,
        setsInRun: event.sets.length,
        stagesWithSets,
      }
    }

    case "stage":
      return {
        ...prev,
        stageStates: { ...prev.stageStates, [event.stage]: event.state === "error" ? "error" : event.state },
        counts: event.counts
          ? {
              // Stage totals already include their per-set counts; only the
              // set-less stages (series, sets) add anything here.
              ...prev.counts,
              ...(event.stage === "series" || event.stage === "sets"
                ? {
                    downloaded: prev.counts.downloaded + event.counts.downloaded,
                    updated: prev.counts.updated + event.counts.updated,
                    skipped: prev.counts.skipped + event.counts.skipped,
                    failed: prev.counts.failed + event.counts.failed,
                  }
                : {}),
            }
          : prev.counts,
        currentLabel: event.state === "running" ? null : prev.currentLabel,
      }

    case "set": {
      const next: SetRunState =
        event.state === "running"
          ? { state: "running", done: 0, total: 0 }
          : {
              state: event.state === "done" ? "done" : event.state === "skipped" ? "skipped" : "error",
              message: event.message,
              unavailable: event.unavailable,
            }
      return {
        ...prev,
        setStates: { ...prev.setStates, [event.setId]: next },
        counts: event.counts
          ? {
              downloaded: prev.counts.downloaded + event.counts.downloaded,
              updated: prev.counts.updated + event.counts.updated,
              skipped: prev.counts.skipped + event.counts.skipped,
              failed: prev.counts.failed + event.counts.failed,
            }
          : prev.counts,
        currentLabel: `${event.setId} · ${event.setName} (${event.index}/${event.total})`,
      }
    }

    case "item": {
      const current = prev.setStates[event.setId]
      if (!current || current.state !== "running") return prev
      return {
        ...prev,
        setStates: {
          ...prev.setStates,
          [event.setId]: { ...current, done: event.done, total: event.total },
        },
      }
    }

    case "done":
      return {
        ...prev,
        status: event.cancelled ? "cancelled" : event.counts.failed > 0 ? "error" : "done",
        durationMs: event.durationMs,
        // The server's totals are authoritative; the running tally was only there
        // to give the numbers something to move against during the run.
        counts: event.counts,
        failures: event.failures,
        currentLabel: null,
      }

    default:
      return prev
  }
}
