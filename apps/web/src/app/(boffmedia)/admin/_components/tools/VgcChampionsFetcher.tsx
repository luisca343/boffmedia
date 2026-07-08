"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Input, Icon, Spinner } from "@/components/boffmedia/primitives"
import { AvPanel, AvAlert, AvPill } from "../ui/av-kit"
import {
  BatchFetchResult,
  ChampionsRegulation,
  VgcMetaService,
  VgcRegulationsAdminService,
} from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"

const TH = "text-left font-mono text-[10px] uppercase tracking-[0.08em] text-txt-muted font-semibold py-2.5 px-4 border-b border-solid border-line"

type PillTone = "amber" | "accent" | "green" | "rose" | "muted"

export function VgcChampionsFetcher() {
  const t = useTranslations("admin.vgc")
  const { session } = useBoffSession()

  const statusPill = (r: ChampionsRegulation | undefined): { text: string; tone: PillTone } => {
    switch (r?.importStatus) {
      case "running_csv":
        return { text: t("champions.statusRunningCsv"), tone: "amber" }
      case "running_pastes": {
        const total = r.importTeamCount ?? 0
        const fetched = r.importFetchedCount ?? 0
        return {
          text: total > 0
            ? t("champions.statusRunningPastesProgress", { fetched, total })
            : t("champions.statusRunningPastes"),
          tone: "accent",
        }
      }
      case "done":
        return { text: t("champions.statusDone"), tone: "green" }
      case "error":
        return { text: t("champions.statusError"), tone: "rose" }
      default:
        return { text: t("champions.statusNoData"), tone: "muted" }
    }
  }
  const token = session?.user?.accessToken ?? ""

  const [available, setAvailable] = useState<ChampionsRegulation[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [fetchingPastes, setFetchingPastes] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [addingRegulation, setAddingRegulation] = useState(false)

  const [newRegulationId, setNewRegulationId] = useState("")
  const [newFormatId, setNewFormatId] = useState("")
  const [newName, setNewName] = useState("")
  const [newGid, setNewGid] = useState("")

  useEffect(() => {
    const existing = available.find((r) => r.id === newRegulationId.trim())
    if (!existing) return
    if (!newFormatId) setNewFormatId(existing.formatId ?? "")
    if (!newName) setNewName(existing.name ?? "")
    if (!newGid) setNewGid(existing.vgcPastesGid ?? "")
  }, [newRegulationId, available])

  const loadAvailable = (silent = false) => {
    if (!silent) setLoading(true)
    VgcMetaService.getAvailableChampionsRegulations()
      .then((res) => setAvailable(res.data ?? []))
      .catch(() => setError(t("champions.loadErr")))
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }

  useEffect(() => {
    loadAvailable()
  }, [])

  useEffect(() => {
    if (!refreshing && !fetchingPastes) return
    const id = setInterval(() => loadAvailable(true), 2000)
    return () => clearInterval(id)
  }, [refreshing, fetchingPastes])

  const handleRefresh = async (regulationId: string) => {
    setRefreshing(regulationId)
    setError(null)
    setSuccess(null)
    if (!token) {
      setError(t("invalidSession"))
      setRefreshing(null)
      return
    }
    try {
      const res = await VgcMetaService.refreshChampions(regulationId, token)
      setSuccess(t("champions.importOk", { count: res.data?.count ?? 0, id: regulationId }))
      loadAvailable()
    } catch {
      setError(t("champions.importErr"))
    } finally {
      setRefreshing(null)
    }
  }

  const handleFetchPastes = async (regulationId: string) => {
    setFetchingPastes(regulationId)
    setError(null)
    setSuccess(null)
    if (!token) {
      setError(t("invalidSession"))
      setFetchingPastes(null)
      return
    }
    try {
      const res = await VgcMetaService.fetchChampionsPastes(regulationId, token)
      const r = res.data as BatchFetchResult | undefined
      setSuccess(
        r
          ? t("champions.pastesOk", { fetched: r.fetched, cached: r.cached, failed: r.failed, total: r.total })
          : t("champions.pastesOkSimple", { id: regulationId }),
      )
    } catch {
      setError(t("champions.pastesErr"))
    } finally {
      loadAvailable(true)
      setFetchingPastes(null)
    }
  }

  const handleUpsertRegulation = async () => {
    setError(null)
    setSuccess(null)
    if (!token) {
      setError(t("invalidSession"))
      return
    }
    if (!newRegulationId.trim() || !newFormatId.trim() || !newName.trim()) {
      setError(t("champions.missingFields"))
      return
    }
    setAddingRegulation(true)
    try {
      await VgcRegulationsAdminService.upsertRegulation(
        {
          id: newRegulationId.trim(),
          formatId: newFormatId.trim(),
          name: newName.trim(),
          ...(newGid.trim() ? { vgcPastesGid: newGid.trim() } : {}),
        },
        token,
      )
      setSuccess(t("champions.saveOk", { id: newRegulationId.trim() }))
      setNewRegulationId("")
      setNewFormatId("")
      setNewName("")
      setNewGid("")
      loadAvailable(true)
      window.dispatchEvent(new CustomEvent("vgc-regulations-updated"))
    } catch {
      setError(t("champions.saveErr"))
    } finally {
      setAddingRegulation(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-txt-muted">{t("champions.intro")}</p>

      <AvPanel title={t("champions.registerTitle")} icon="plus">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input value={newRegulationId} onChange={(e) => setNewRegulationId(e.target.value)} placeholder={t("champions.idPlaceholder")} />
          <Input value={newFormatId} onChange={(e) => setNewFormatId(e.target.value)} placeholder={t("champions.formatPlaceholder")} />
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("champions.namePlaceholder")} />
          <Input value={newGid} onChange={(e) => setNewGid(e.target.value)} placeholder={t("champions.gidPlaceholder")} />
        </div>
        <div className="mt-4">
          <Button size="sm" loading={addingRegulation} disabled={addingRegulation} onClick={handleUpsertRegulation}>
            {addingRegulation ? t("champions.saving") : t("champions.save")}
          </Button>
        </div>
      </AvPanel>

      <AvPanel
        title={t("champions.configuredTitle")}
        icon="database"
        aside={
          <button onClick={() => loadAvailable()} aria-label={t("reload")} className="text-txt-dim hover:text-txt transition-colors">
            <Icon name="refresh" size={14} />
          </button>
        }
        flush
      >
        {loading ? (
          <div className="py-8 flex justify-center">
            <Spinner size={16} className="text-accent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-panel-2">
                  <th className={TH}>{t("champions.colRegulation")}</th>
                  <th className={TH}>{t("champions.colStatus")}</th>
                  <th className={TH} />
                </tr>
              </thead>
              <tbody>
                {available.map((regulation) => {
                  const hasData = (regulation?.importTeamCount ?? 0) > 0
                  const isRefreshing = refreshing === regulation.id
                  const isFetching = fetchingPastes === regulation.id
                  const status = statusPill(regulation)
                  return (
                    <tr key={regulation.id} className="border-b border-solid border-line last:border-b-0 hover:bg-panel-2 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{regulation.name}</p>
                        <p className="text-txt-dim text-[11px] font-mono">{regulation.id}</p>
                        <p className="text-txt-dim text-[11px] font-mono">{regulation.formatId}</p>
                        {regulation?.importTeamCount ? (
                          <p className="text-txt-dim text-[11px]">{t("champions.teamsImported", { count: regulation.importTeamCount ?? 0 })}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <AvPill tone={status.tone}>{status.text}</AvPill>
                          {regulation?.importError ? (
                            <p className="text-[11px] text-bad max-w-56 truncate" title={regulation.importError}>
                              {regulation.importError}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            icon="refresh"
                            loading={isRefreshing}
                            disabled={isRefreshing || isFetching || !regulation.vgcPastesGid}
                            onClick={() => handleRefresh(regulation.id)}
                          >
                            {isRefreshing ? t("champions.importingCsv") : t("champions.importCsv")}
                          </Button>
                          <Button
                            size="sm"
                            icon="download"
                            loading={isFetching}
                            disabled={!hasData || isRefreshing || isFetching || !regulation.vgcPastesGid}
                            onClick={() => handleFetchPastes(regulation.id)}
                          >
                            {isFetching ? t("champions.fetchingPastes") : t("champions.fetchPastes")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AvPanel>

      {error && <AvAlert tone="error">{error}</AvAlert>}
      {success && <AvAlert tone="success">{success}</AvAlert>}

      <p className="text-xs text-txt-dim">{t("champions.source")}</p>
    </div>
  )
}
