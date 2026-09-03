"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Select, Icon, Spinner, toast, Table } from "@boffmedia/ui"
import { AvPanel, AvAlert, AvProgressBar, AvPill } from "../../_components/ui/av-kit"
import {
  ChampionsRegulation,
  LimitlessTournament,
  LimitlessImportJobStatus,
  VgcMetaService,
} from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"
import { usePolling } from "../../_components/hooks/usePolling"

const POLLING_INTERVAL_MS = 3000

export function VgcLimitlessFetcher() {
  const t = useTranslations("admin.vgc")
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ""

  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])
  const [url, setUrl] = useState("")
  const [regulationId, setRegulationId] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tournaments, setTournaments] = useState<LimitlessTournament[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [pollingEnabled, setPollingEnabled] = useState(false)

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
    VgcMetaService.getRegulations()
      .then((res) => {
        const regs = res.data ?? []
        setRegulations(regs)
        if (!regulationId && regs.length > 0) setRegulationId(regs[0].id)
      })
      .catch(() => setError(t("limitless.loadRegErr")))
  }

  useEffect(() => {
    loadRegulations()
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

  usePolling(
    async () => {
      const runningIds = tournaments.filter((t) => t.status === "running").map((t) => t.id)
      await Promise.all(
        runningIds.map((tournamentId) =>
          VgcMetaService.getLimitlessTournamentStatus(tournamentId)
            .then((res) => {
              const job = res.data as LimitlessImportJobStatus | undefined
              if (!job) return
              setTournaments((prev) =>
                prev.map((t) =>
                  t.id === tournamentId
                    ? { ...t, status: job.status as LimitlessTournament["status"], progress: job.progress, total: job.total, errorMessage: job.errorMessage ?? null }
                    : t,
                ),
              )
            })
            .catch(() => {}),
        ),
      )
    },
    POLLING_INTERVAL_MS,
    tournaments.some((t) => t.status === "running"),
  )

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
    try {
      const res = await VgcMetaService.importLimitlessTournament(url.trim(), regulationId, token, max)
      const tournamentId = res.data?.tournamentId
      if (tournamentId) {
        const msg = t("limitless.startedOk", { id: tournamentId })
        toast({ msg, tone: "ok" })
        setUrl("")
        setMaxPlayers("")
        loadTournaments()
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? t("limitless.startErr")
      setError(msg)
      toast({ msg, tone: "bad" })
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
      </AvPanel>

      <AvPanel title={t("limitless.importedTitle")} icon="database" flush>
        <Table
          columns={[
            { label: t("limitless.colTournament"), key: "tournament" },
            { label: t("limitless.colStatus"), key: "status" },
            { label: t("limitless.colPlayers"), key: "players" },
            { label: t("limitless.colLoaded"), key: "loaded" },
          ]}
          rows={[...tournaments]
            .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
            .map((tournament) => ({
              tournament: (
                <div>
                  <p className="text-xs font-medium">{tournament.name ?? tournament.limitlessId}</p>
                  <p className="text-txt-dim text-[0.6875rem] font-mono">{tournament.date ?? "—"} · {tournament.format ?? "—"}</p>
                  {tournament.errorMessage && <p className="text-bad text-[0.6875rem] mt-0.5 truncate max-w-xs">{tournament.errorMessage}</p>}
                </div>
              ),
              status: (
                <div className="space-y-1.5">
                  {tournament.status === "running" && <AvPill tone="amber">{t("limitless.statusRunning")}</AvPill>}
                  {tournament.status === "done" && <AvPill tone="green" icon="check">{t("limitless.statusDone")}</AvPill>}
                  {tournament.status === "error" && <AvPill tone="rose" icon="alert">{t("limitless.statusError")}</AvPill>}
                  {tournament.status === "pending" && <AvPill tone="muted">{t("limitless.statusPending")}</AvPill>}
                  {tournament.status === "running" && tournament.total > 0 && (
                    <div className="w-32">
                      <AvProgressBar value={tournament.progress} max={tournament.total} label={`${tournament.progress}/${tournament.total}`} />
                    </div>
                  )}
                </div>
              ),
              players: <span className="text-xs text-txt-muted">{tournament.playerCount ?? "—"}</span>,
              loaded: <span className="text-xs text-txt-muted font-mono">{tournament.progress ? `${tournament.progress}/${tournament.total}` : "—"}</span>,
            }))}
          rowKey={(_, i) => i}
        />
      </AvPanel>

      <p className="text-xs text-txt-dim">{t("limitless.source")}</p>
    </div>
  )
}
