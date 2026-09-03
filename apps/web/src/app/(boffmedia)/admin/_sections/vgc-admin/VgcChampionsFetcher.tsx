"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Input, Icon, Spinner, toast, Table } from "@boffmedia/ui"
import { AvPanel, AvAlert, AvPill } from "../../_components/ui/av-kit"
import {
  BatchFetchResult,
  ChampionsRegulation,
  VgcMetaService,
  VgcRegulationsAdminService,
} from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"
import { usePolling } from "../../_components/hooks/usePolling"

const POLLING_INTERVAL_MS = 2000

type PillTone = "amber" | "accent" | "green" | "rose" | "muted"

const statusPill = (r: ChampionsRegulation | undefined, t: (key: string, opts?: any) => string): { text: string; tone: PillTone } => {
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

const TH = "text-left font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-muted font-semibold py-2.5 px-4 border-b border-solid border-line"

export function VgcChampionsFetcher() {
  const t = useTranslations("admin.vgc")
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ""

  const [available, setAvailable] = useState<ChampionsRegulation[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [fetchingPastes, setFetchingPastes] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addingRegulation, setAddingRegulation] = useState(false)

  const [newRegulationId, setNewRegulationId] = useState("")
  const [newFormatId, setNewFormatId] = useState("")
  const [newName, setNewName] = useState("")
  const [newGid, setNewGid] = useState("")
  const [newActive, setNewActive] = useState(true)

  useEffect(() => {
    const existing = available.find((r) => r.id === newRegulationId.trim())
    if (!existing) return
    if (!newFormatId) setNewFormatId(existing.formatId ?? "")
    if (!newName) setNewName(existing.name ?? "")
    if (!newGid) setNewGid(existing.vgcPastesGid ?? "")
  }, [newRegulationId, available])

  // formatId defaults to id server-side; showing that here keeps the two fields
  // from looking like two unrelated things you must both invent.
  const effectiveFormatId = newFormatId.trim() || newRegulationId.trim()

  const loadIntoForm = (r: ChampionsRegulation) => {
    setNewRegulationId(r.id)
    setNewFormatId(r.formatId ?? "")
    setNewName(r.name ?? "")
    setNewGid(r.vgcPastesGid ?? "")
    setNewActive(Boolean(r.active ?? true))
    setError(null)
  }

  const loadAvailable = (silent = false) => {
    if (!silent) setLoading(true)
    // Admin list, not the public one: `active: false` regulations must stay
    // visible here or there is no way to switch one back on.
    const request = token
      ? VgcRegulationsAdminService.getAllRegulations(token)
      : VgcMetaService.getRegulations()
    request
      .then((res) => setAvailable(res.data ?? []))
      .catch(() => setError(t("champions.loadErr")))
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }

  useEffect(() => {
    loadAvailable()
  }, [token])

  usePolling(() => loadAvailable(true), POLLING_INTERVAL_MS, !!(refreshing || fetchingPastes))

  const handleRefresh = async (regulationId: string) => {
    setRefreshing(regulationId)
    setError(null)
    if (!token) {
      setError(t("invalidSession"))
      setRefreshing(null)
      return
    }
    try {
      const res = await VgcMetaService.refreshChampions(regulationId, token)
      const msg = t("champions.importOk", { count: res.data?.count ?? 0, id: regulationId })
      toast({ msg, tone: "ok" })
      loadAvailable()
    } catch {
      const msg = t("champions.importErr")
      setError(msg)
      toast.error(msg)
    } finally {
      setRefreshing(null)
    }
  }

  const handleFetchPastes = async (regulationId: string) => {
    setFetchingPastes(regulationId)
    setError(null)
    if (!token) {
      setError(t("invalidSession"))
      setFetchingPastes(null)
      return
    }
    try {
      const res = await VgcMetaService.fetchChampionsPastes(regulationId, token)
      const r = res.data as BatchFetchResult | undefined
      const msg = r
        ? t("champions.pastesOk", { fetched: r.fetched, cached: r.cached, failed: r.failed, total: r.total })
        : t("champions.pastesOkSimple", { id: regulationId })
      toast({ msg, tone: "ok" })
    } catch {
      const msg = t("champions.pastesErr")
      setError(msg)
      toast.error(msg)
    } finally {
      loadAvailable(true)
      setFetchingPastes(null)
    }
  }

  const handleUpsertRegulation = async () => {
    setError(null)
    if (!token) {
      setError(t("invalidSession"))
      return
    }
    if (!newRegulationId.trim() || !newName.trim()) {
      setError(t("champions.missingFields"))
      return
    }
    setAddingRegulation(true)
    try {
      await VgcRegulationsAdminService.upsertRegulation(
        {
          id: newRegulationId.trim(),
          formatId: effectiveFormatId,
          name: newName.trim(),
          active: newActive,
          ...(newGid.trim() ? { vgcPastesGid: newGid.trim() } : {}),
        },
        token,
      )
      const msg = t("champions.saveOk", { id: newRegulationId.trim() })
      toast({ msg, tone: "ok" })
      setNewRegulationId("")
      setNewFormatId("")
      setNewName("")
      setNewGid("")
      setNewActive(true)
      loadAvailable(true)
      window.dispatchEvent(new CustomEvent("vgc-regulations-updated"))
    } catch (e) {
      // The API rejects an unknown formatId with a Spanish userMessage listing
      // the valid ones — far more useful than the generic fallback.
      const userMessage = (e as { userMessage?: string })?.userMessage
      const msg = userMessage ?? t("champions.saveErr")
      setError(msg)
      toast.error(msg)
    } finally {
      setAddingRegulation(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-txt-muted">{t("champions.intro")}</p>

      <AvPanel title={t("champions.registerTitle")} icon="plus">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Input value={newRegulationId} onChange={(e) => setNewRegulationId(e.target.value)} placeholder={t("champions.idPlaceholder")} />
            <p className="text-[0.6875rem] text-txt-dim">{t("champions.idHint")}</p>
          </div>
          <div className="space-y-1">
            <Input value={newFormatId} onChange={(e) => setNewFormatId(e.target.value)} placeholder={effectiveFormatId || t("champions.formatPlaceholder")} />
            <p className="text-[0.6875rem] text-txt-dim">{t("champions.formatHint")}</p>
          </div>
          <div className="space-y-1">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("champions.namePlaceholder")} />
            <p className="text-[0.6875rem] text-txt-dim">{t("champions.nameHint")}</p>
          </div>
          <div className="space-y-1">
            <Input value={newGid} onChange={(e) => setNewGid(e.target.value)} placeholder={t("champions.gidPlaceholder")} />
            <p className="text-[0.6875rem] text-txt-dim">{t("champions.gidHint")}</p>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-txt-muted cursor-pointer">
          <input type="checkbox" checked={newActive} onChange={(e) => setNewActive(e.target.checked)} className="accent-accent" />
          {t("champions.activeLabel")}
        </label>
        <p className="mt-1 text-[0.6875rem] text-txt-dim">{t("champions.activeHint")}</p>
        <div className="mt-4">
          <Button size="sm" loading={addingRegulation} disabled={addingRegulation} onClick={handleUpsertRegulation}>
            {addingRegulation ? t("champions.saving") : t("champions.save")}
          </Button>
        </div>
      </AvPanel>

      <AvPanel title={t("champions.configuredTitle")} icon="database" flush>
        <Table
          columns={[
            { label: t("champions.colRegulation"), key: "regulation" },
            { label: t("champions.colStatus"), key: "status" },
            { label: "", key: "actions", srOnly: true },
          ]}
          rows={available.map((regulation) => {
            const hasData = (regulation?.importTeamCount ?? 0) > 0
            const isRefreshing = refreshing === regulation.id
            const isFetching = fetchingPastes === regulation.id
            return {
              regulation: (
                <div>
                  <p className="text-xs font-medium">
                    {regulation.name}
                    {regulation.active ? null : (
                      <span className="ml-2 text-[0.625rem] uppercase tracking-wide text-txt-dim">{t("champions.inactiveTag")}</span>
                    )}
                  </p>
                  <p className="text-txt-dim text-[0.6875rem] font-mono">{regulation.id}</p>
                  <p className="text-txt-dim text-[0.6875rem] font-mono">{regulation.formatId}</p>
                  {regulation?.importTeamCount ? (
                    <p className="text-txt-dim text-[0.6875rem]">{t("champions.teamsImported", { count: regulation.importTeamCount ?? 0 })}</p>
                  ) : null}
                </div>
              ),
              status: (
                <div className="space-y-1">
                  <AvPill tone={statusPill(regulation, t).tone}>{statusPill(regulation, t).text}</AvPill>
                  {regulation?.importError ? (
                    <p className="text-[0.6875rem] text-bad max-w-56 truncate" title={regulation.importError}>
                      {regulation.importError}
                    </p>
                  ) : null}
                </div>
              ),
              actions: (
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="ghost" icon="edit" onClick={() => loadIntoForm(regulation)}>
                    {t("champions.edit")}
                  </Button>
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
              ),
            }
          })}
          rowKey={(_, i) => i}
        />
      </AvPanel>

      {error && <AvAlert tone="error">{error}</AvAlert>}

      <p className="text-xs text-txt-dim">{t("champions.source")}</p>
    </div>
  )
}
