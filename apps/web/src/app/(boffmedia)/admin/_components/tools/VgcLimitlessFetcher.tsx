"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { ToolPanel } from "@/components/boffmedia/primitives/tool-panel"
import {
  ChampionsRegulation,
  LimitlessTournament,
  LimitlessImportJobStatus,
  VgcMetaService,
} from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"

function inputClass() {
  return "w-full h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
}

function labelClass() {
  return "block text-xs text-[var(--text-muted)] mb-1"
}

function StatusDot({ status }: { status: LimitlessTournament["status"] }) {
  if (status === "running")
    return <Loader2 className="w-3 h-3 animate-spin text-amber-400 inline" />
  if (status === "done")
    return <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
  if (status === "error")
    return <AlertCircle className="w-3 h-3 text-red-400 inline" />
  return <span className="w-2 h-2 rounded-full bg-[var(--text-dim)] inline-block" />
}

function ProgressBar({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-[var(--text-dim)] tabular-nums">{progress}/{total}</span>
    </div>
  )
}

export function VgcLimitlessFetcher() {
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ''

  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])

  const [url,          setUrl]          = useState("")
  const [regulationId, setRegulationId] = useState("")
  const [maxPlayers,   setMaxPlayers]   = useState("")
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState<string | null>(null)

  const [tournaments, setTournaments]   = useState<LimitlessTournament[]>([])
  const [loadingList, setLoadingList]   = useState(false)

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
        if (!regulationId && regs.length > 0) {
          setRegulationId(regs[0].id)
        }
      })
      .catch(() => {
        setError("No se pudieron cargar las regulaciones.")
      })
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
    return () => {
      window.removeEventListener("vgc-regulations-updated", onRegulationsUpdated)
    }
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
      } catch { /* ignore */ }
    }, 3000)
    pollingRef.current.set(tournamentId, interval)
  }

  const handleSubmit = async () => {
    if (!url.trim()) { setError("Introduce la URL del torneo."); return }
    if (!regulationId) {
      setError("No hay regulación disponible. Regístrala primero en Champions.")
      return
    }
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.")
      return
    }
    const max = maxPlayers.trim() ? parseInt(maxPlayers, 10) : undefined
    if (max !== undefined && (isNaN(max) || max < 1)) {
      setError("Max jugadores debe ser un número positivo.")
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await VgcMetaService.importLimitlessTournament(url.trim(), regulationId, token, max)
      const tournamentId = res.data?.tournamentId
      if (tournamentId) {
        setSuccess(`Importación iniciada (ID #${tournamentId}). Procesando en segundo plano...`)
        setUrl("")
        setMaxPlayers("")
        loadTournaments()
        startPolling(tournamentId)
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Error al iniciar la importación."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const thClass = "px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] font-semibold"

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-[var(--text-muted)]">
        Importa torneos de{" "}
        <a href="https://play.limitlesstcg.com" target="_blank" rel="noopener noreferrer"
          className="text-[var(--orange-500)] hover:underline">
          Limitless TCG
        </a>{" "}
        para agregar estadísticas de uso de los decklists VGC. Solo se necesitan 2 peticiones a la API por torneo.
      </p>

      {/* Import form */}
      <ToolPanel title="Importar torneo">
        <div className="space-y-3">
          <div>
            <label className={labelClass()}>URL del torneo</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://play.limitlesstcg.com/tournament/..." className={inputClass()} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass()}>Regulación</label>
              <select value={regulationId} onChange={(e) => setRegulationId(e.target.value)} className={inputClass()}>
                {regulations.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass()}>
                Max jugadores <span className="text-[var(--text-dim)]">(opcional)</span>
              </label>
              <input type="number" min={1} value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="Todos" className={inputClass()} />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <BoffButton size="sm" onClick={handleSubmit} disabled={submitting || !url.trim() || !regulationId} block>
            {submitting ? (
              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Iniciando...</>
            ) : (
              <><Upload className="w-3 h-3 mr-1.5" />Importar torneo</>
            )}
          </BoffButton>
        </div>

        {error   && <p className="text-xs text-red-400 mt-2">{error}</p>}
        {success && <p className="text-xs text-emerald-400 mt-2">{success}</p>}
      </ToolPanel>

      {/* Tournament list */}
      <ToolPanel
        title="Torneos importados"
        headRight={
          <button onClick={() => loadTournaments()} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        }
      >
        {loadingList ? (
          <div className="py-8 flex justify-center text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-[var(--text-dim)]">
            No hay torneos importados para esta regulación.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_96%,transparent)]">
                <th className={thClass}>Torneo</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Jugadores</th>
                <th className={thClass}>Cargados</th>
              </tr>
            </thead>
            <tbody>
              {[...tournaments].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).map((t) => (
                <tr key={t.id} className="border-b border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--text)_3%,transparent)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[var(--text)] text-xs font-medium">{t.name ?? t.limitlessId}</p>
                    <p className="text-[var(--text-dim)] text-[11px] font-mono">{t.date ?? "—"} · {t.format ?? "—"}</p>
                    {t.errorMessage && (
                      <p className="text-red-400 text-[11px] mt-0.5 truncate max-w-xs">{t.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <StatusDot status={t.status} />
                      <span className="text-[var(--text-muted)]">
                        {t.status === "running" ? "Procesando" :
                         t.status === "done"    ? "Listo" :
                         t.status === "error"   ? "Error" : "Pendiente"}
                      </span>
                    </span>
                    {t.status === "running" && t.total > 0 && (
                      <div className="mt-1.5 w-32">
                        <ProgressBar progress={t.progress} total={t.total} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {t.playerCount ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {t.progress ? `${t.progress}/${t.total}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ToolPanel>

      <p className="text-xs text-[var(--text-dim)]">
        Fuente: Limitless TCG API · 2 peticiones por torneo · Los decklists VGC son JSON estructurado (no texto Showdown).
      </p>
    </div>
  )
}
