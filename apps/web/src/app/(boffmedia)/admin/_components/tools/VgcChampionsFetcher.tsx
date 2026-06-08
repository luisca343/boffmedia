"use client"

import { useEffect, useState } from "react"
import { Download, Loader2, RefreshCw } from "lucide-react"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { ToolPanel } from "@/components/boffmedia/primitives/tool-panel"
import {
  BatchFetchResult,
  ChampionsRegulation,
  VgcMetaService,
  VgcRegulationsAdminService,
} from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"

function inputClass() {
  return "w-full h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
}

function labelClass() {
  return "text-[11px] text-[var(--text-dim)] font-medium uppercase tracking-wider"
}

export function VgcChampionsFetcher() {
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ''

  const [available,      setAvailable]      = useState<ChampionsRegulation[]>([])
  const [loading,        setLoading]        = useState(false)
  const [refreshing,     setRefreshing]     = useState<string | null>(null)
  const [fetchingPastes, setFetchingPastes] = useState<string | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [success,        setSuccess]        = useState<string | null>(null)
  const [addingRegulation, setAddingRegulation] = useState(false)

  const [newRegulationId, setNewRegulationId] = useState("")
  const [newFormatId, setNewFormatId] = useState("")
  const [newName, setNewName] = useState("")
  const [newGid, setNewGid] = useState("")

  useEffect(() => {
    const existing = available.find((r) => r.id === newRegulationId.trim())
    if (!existing) return
    if (!newFormatId) setNewFormatId(existing.formatId ?? "")
    if (!newName)     setNewName(existing.name ?? "")
    if (!newGid)      setNewGid(existing.vgcPastesGid ?? "")
  }, [newRegulationId, available])

  const loadAvailable = (silent = false) => {
    if (!silent) setLoading(true)
    VgcMetaService.getAvailableChampionsRegulations()
      .then((res) => setAvailable(res.data ?? []))
      .catch(() => setError("No se pudo cargar el estado de Champions."))
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }

  useEffect(() => { loadAvailable() }, [])

  useEffect(() => {
    if (!refreshing && !fetchingPastes) return
    const id = setInterval(() => {
      loadAvailable(true)
    }, 2000)
    return () => clearInterval(id)
  }, [refreshing, fetchingPastes])

  const getStatusLabel = (regulation: ChampionsRegulation | undefined) => {
    switch (regulation?.importStatus) {
      case 'running_csv':
        return { text: 'Importando CSV', className: 'text-amber-400', dot: 'bg-amber-400' }
      case 'running_pastes': {
        const total   = regulation.importTeamCount ?? 0
        const fetched = regulation.importFetchedCount ?? 0
        const progress = total > 0 ? ` (${fetched}/${total})` : ''
        return { text: `Descargando pastes${progress}`, className: 'text-sky-400', dot: 'bg-sky-400' }
      }
      case 'done':
        return { text: 'Importado', className: 'text-emerald-400', dot: 'bg-emerald-400' }
      case 'error':
        return { text: 'Error', className: 'text-red-400', dot: 'bg-red-400' }
      default:
        return { text: 'Sin datos', className: 'text-[var(--text-dim)]', dot: 'bg-[var(--text-dim)]' }
    }
  }

  const handleRefresh = async (regulationId: string) => {
    setRefreshing(regulationId)
    setError(null)
    setSuccess(null)
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.")
      setRefreshing(null)
      return
    }
    try {
      const res = await VgcMetaService.refreshChampions(regulationId, token)
      setSuccess(`Importados ${res.data?.count ?? 0} equipos para ${regulationId}.`)
      loadAvailable()
    } catch {
      setError("Error al importar los datos de Champions.")
    } finally {
      setRefreshing(null)
    }
  }

  const handleFetchPastes = async (regulationId: string) => {
    setFetchingPastes(regulationId)
    setError(null)
    setSuccess(null)
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.")
      setFetchingPastes(null)
      return
    }
    try {
      const res = await VgcMetaService.fetchChampionsPastes(regulationId, token)
      const r = res.data as BatchFetchResult | undefined
      setSuccess(
        r
          ? `Descargados ${r.fetched} pastes (${r.cached} en caché, ${r.failed} fallidos) de ${r.total} equipos.`
          : `Pastes descargados para ${regulationId}.`,
      )
    } catch {
      setError("Error al descargar los pastes.")
    } finally {
      loadAvailable(true)
      setFetchingPastes(null)
    }
  }

  const handleUpsertRegulation = async () => {
    setError(null)
    setSuccess(null)
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.")
      return
    }
    if (!newRegulationId.trim() || !newFormatId.trim() || !newName.trim()) {
      setError("Completa id, formatId y nombre para registrar la regulación.")
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
      setSuccess(`Regulación ${newRegulationId.trim()} guardada.`)
      setNewRegulationId("")
      setNewFormatId("")
      setNewName("")
      setNewGid("")
      loadAvailable(true)
      window.dispatchEvent(new CustomEvent("vgc-regulations-updated"))
    } catch {
      setError("Error al guardar la regulación.")
    } finally {
      setAddingRegulation(false)
    }
  }

  const thClass = "px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] font-semibold"

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-[var(--text-muted)]">
        Importa datos del CSV de VGCPastes (Google Sheets). Agrega uso por especie y co-aparición de compañeros de equipo. Los equipos individuales se guardan en <code className="text-[var(--text-dim)]">vgc_paste_teams</code>.
      </p>

      <ToolPanel title="Registrar regulación">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={newRegulationId} onChange={(e) => setNewRegulationId(e.target.value)}
            placeholder="id (ej. vgc2026regf)" className={inputClass()} />
          <input value={newFormatId} onChange={(e) => setNewFormatId(e.target.value)}
            placeholder="formatId (ej. gen9vgc2026regf)" className={inputClass()} />
          <input value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre visible" className={inputClass()} />
          <input value={newGid} onChange={(e) => setNewGid(e.target.value)}
            placeholder="VGCPastes GID (opcional)" className={inputClass()} />
        </div>

        <div className="mt-3">
          <BoffButton size="sm" variant="outline" onClick={handleUpsertRegulation} disabled={addingRegulation}>
            {addingRegulation ? (
              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Guardando...</>
            ) : (
              "Guardar regulación"
            )}
          </BoffButton>
        </div>
      </ToolPanel>

      {/* Regulation table */}
      <ToolPanel
        title="Regulaciones configuradas"
        headRight={
          <button onClick={() => loadAvailable()} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        }
      >
        {loading ? (
          <div className="py-8 flex justify-center text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_96%,transparent)]">
                <th className={thClass}>Regulación</th>
                <th className={thClass}>Estado</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {available.map((regulation) => {
                const hasData       = (regulation?.importTeamCount ?? 0) > 0
                const isRefreshing  = refreshing === regulation.id
                const isFetching    = fetchingPastes === regulation.id
                const status        = getStatusLabel(regulation)
                return (
                  <tr key={regulation.id} className="border-b border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--text)_3%,transparent)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[var(--text)] text-xs font-medium">{regulation.name}</p>
                      <p className="text-[var(--text-dim)] text-[11px] font-mono">{regulation.id}</p>
                      <p className="text-[var(--text-dim)] text-[11px] font-mono">{regulation.formatId}</p>
                      {regulation?.importTeamCount ? (
                        <p className="text-[var(--text-dim)] text-[11px]">
                          {regulation.importTeamCount ?? 0} equipos importados
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 text-xs ${status.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.text}
                        </span>
                        {regulation?.importError ? (
                          <p className="text-[11px] text-red-400 max-w-56 truncate" title={regulation.importError}>
                            {regulation.importError}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <BoffButton size="sm" variant="outline" onClick={() => handleRefresh(regulation.id)}
                          disabled={isRefreshing || isFetching || !regulation.vgcPastesGid}>
                          {isRefreshing ? (
                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Importando...</>
                          ) : (
                            <><RefreshCw className="w-3 h-3 mr-1.5" />Importar CSV</>
                          )}
                        </BoffButton>
                        <BoffButton size="sm" variant="outline" onClick={() => handleFetchPastes(regulation.id)}
                          disabled={!hasData || isRefreshing || isFetching || !regulation.vgcPastesGid}>
                          {isFetching ? (
                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Descargando...</>
                          ) : (
                            <><Download className="w-3 h-3 mr-1.5" />Fetch Pastes</>
                          )}
                        </BoffButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </ToolPanel>

      {error   && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">{success}</p>}

      <p className="text-xs text-[var(--text-dim)]">
        Fuente: Google Sheets VGCPastes · GID por regulación en{" "}
        <code className="text-[var(--text-muted)]">champions-data.ts</code> · Añadir nueva regulación: crear entrada en ese archivo y actualizar <code className="text-[var(--text-muted)]">REGULATION_OPTIONS</code> aquí.
      </p>
    </div>
  )
}
