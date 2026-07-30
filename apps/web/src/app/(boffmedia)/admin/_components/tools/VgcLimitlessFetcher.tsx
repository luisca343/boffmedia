"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Select, Icon, Spinner } from "@boffmedia/ui"
import { AvPanel, AvAlert, AvPill } from "../ui/av-kit"
import {
  ChampionsRegulation,
  LimitlessTournament,
  LimitlessImportJobStatus,
  VgcMetaService,
} from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"

const TH = "text-left font-mono text-[10px] uppercase tracking-[0.08em] text-txt-muted font-semibold py-2.5 px-4 border-b border-solid border-line"

function ProgressBar({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-panel-2 border border-solid border-line overflow-hidden">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-txt-dim tabular-nums font-mono">{progress}/{total}</span>
    </div>
  )
}

export function VgcLimitlessFetcher() {
  const t = useTranslations("admin.vgc")
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ""

  const StatusPill = ({ status }: { status: LimitlessTournament["status"] }) => {
    if (status === "running") return <AvPill tone="amber">{t("limitless.statusRunning")}</AvPill>
    if (status === "done") return <AvPill tone="green" icon="check">{t("limitless.statusDone")}</AvPill>
    if (status === "error") return <AvPill tone="rose" icon="alert">{t("limitless.statusError")}</AvPill>
    return <AvPill tone="muted">{t("limitless.statusPending")}</AvPill>
  }

  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])
  const [url, setUrl] = useState("")
  const [regulationId, setRegulationId] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tournaments, setTournaments] = useState<LimitlessTournament[]>([])
  const [loadingList, setLoadingList] = useState(false)

  const pollingRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map())

  const loadTournaments = (regId = regulationId) => {
    if (!regId) {
      setTournaments([])
      return
    }
    setLoadingList(true)
    VgcMetaService.getLimitlessTournaments(regId)
      .then((res) => setTournaments(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }

  const loadRegulations = () => {
    VgcMetaService.getAvailableChampionsRegulations()
      .then((res) => {
        const regs = res.data ?? []
        setRegulations(regs)
        if (!regulationId && regs.length > 0) setRegulationId(regs[0].id)
      })
      .catch(() => setError(t("limitless.loadRegErr")))
  }

  useEffect(() => {
    loadRegulations()
    return () => {
      pollingRef.current.forEach((id) => clearInterval(id))
    }
  }, [])

  useEffect(() => {
    const onRegulationsUpdated = () => loadRegulations()
    window.addEventListener("vgc-regulations-updated", onRegulationsUpdated)
    return () => window.removeEventListener("vgc-regulations-updated", onRegulationsUpdated)
  }, [])

  useEffect(() => {
    if (!regulationId) return
    loadTournaments(regulationId)
  }, [regulationId])

  const startPolling = (tournamentId: number) => {
    if (pollingRef.current.has(tournamentId)) return
    const interval = setInterval(async () => {
      try {
        const res = await VgcMetaService.getLimitlessTournamentStatus(tournamentId)
        const job = res.data as LimitlessImportJobStatus | undefined
        if (!job) return
        setTournaments((prev) =>
          prev.map((t) =>
            t.id === tournamentId
              ? { ...t, status: job.status as LimitlessTournament["status"], progress: job.progress, total: job.total, errorMessage: job.errorMessage ?? null }
              : t,
          ),
        )
        if (job.status === "done" || job.status === "error") {
          clearInterval(pollingRef.current.get(tournamentId))
          pollingRef.current.delete(tournamentId)
        }
      } catch {
        /* ignore */
      }
    }, 3000)
    pollingRef.current.set(tournamentId, interval)
  }

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError(t("limitless.noUrl"))
      return
    }
    if (!regulationId) {
      setError(t("limitless.noRegulation"))
      return
    }
    if (!token) {
      setError(t("invalidSession"))
      return
    }
    const max = maxPlayers.trim() ? parseInt(maxPlayers, 10) : undefined
    if (max !== undefined && (isNaN(max) || max < 1)) {
      setError(t("limitless.invalidMax"))
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await VgcMetaService.importLimitlessTournament(url.trim(), regulationId, token, max)
      const tournamentId = res.data?.tournamentId
      if (tournamentId) {
        setSuccess(t("limitless.startedOk", { id: tournamentId }))
        setUrl("")
        setMaxPlayers("")
        loadTournaments()
        startPolling(tournamentId)
      }
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? t("limitless.startErr"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-txt-muted">
        {t.rich("limitless.intro", {
          a: (chunks) => (
            <a href="https://play.limitlesstcg.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {chunks}
            </a>
          ),
        })}
      </p>

      <AvPanel title={t("limitless.importTitle")} icon="upload">
        <div className="space-y-3">
          <Field label={t("limitless.urlLabel")}>
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://play.limitlesstcg.com/tournament/..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t("limitless.regulation")}
              value={regulationId}
              options={regulations.map((r) => ({ value: r.id, label: r.name }))}
              onChange={setRegulationId}
            />
            <Field label={t("limitless.maxPlayers")}>
              <Input type="number" min={1} value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} placeholder={t("limitless.maxPlayersPlaceholder")} />
            </Field>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="pri" icon="upload" loading={submitting} disabled={submitting || !url.trim() || !regulationId} onClick={handleSubmit} className="w-full">
            {submitting ? t("limitless.importing") : t("limitless.import")}
          </Button>
        </div>
        {error && <AvAlert tone="error" className="mt-3">{error}</AvAlert>}
        {success && <AvAlert tone="success" className="mt-3">{success}</AvAlert>}
      </AvPanel>

      <AvPanel
        title={t("limitless.importedTitle")}
        icon="database"
        aside={
          <button onClick={() => loadTournaments()} aria-label={t("reload")} className="text-txt-dim hover:text-txt transition-colors">
            <Icon name="refresh" size={14} />
          </button>
        }
        flush
      >
        {loadingList ? (
          <div className="py-8 flex justify-center">
            <Spinner size={16} className="text-accent" />
          </div>
        ) : tournaments.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-txt-dim">{t("limitless.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-panel-2">
                  <th className={TH}>{t("limitless.colTournament")}</th>
                  <th className={TH}>{t("limitless.colStatus")}</th>
                  <th className={TH}>{t("limitless.colPlayers")}</th>
                  <th className={TH}>{t("limitless.colLoaded")}</th>
                </tr>
              </thead>
              <tbody>
                {[...tournaments].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).map((t) => (
                  <tr key={t.id} className="border-b border-solid border-line last:border-b-0 hover:bg-panel-2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{t.name ?? t.limitlessId}</p>
                      <p className="text-txt-dim text-[11px] font-mono">{t.date ?? "—"} · {t.format ?? "—"}</p>
                      {t.errorMessage && <p className="text-bad text-[11px] mt-0.5 truncate max-w-xs">{t.errorMessage}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={t.status} />
                      {t.status === "running" && t.total > 0 && (
                        <div className="mt-1.5 w-32">
                          <ProgressBar progress={t.progress} total={t.total} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-txt-muted">{t.playerCount ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-txt-muted font-mono">{t.progress ? `${t.progress}/${t.total}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AvPanel>

      <p className="text-xs text-txt-dim">{t("limitless.source")}</p>
    </div>
  )
}
