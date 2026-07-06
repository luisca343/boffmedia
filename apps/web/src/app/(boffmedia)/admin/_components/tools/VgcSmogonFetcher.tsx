"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"
import { BoffButton } from "@/components/boffmedia-v2/primitives/button"
import { ToolPanel } from "@/components/boffmedia-v2/primitives/tool-panel"
import { ChampionsRegulation, SmogonSnapshot, VgcMetaService } from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"

const CUTOFF_OPTIONS = [1760, 1630, 1500, 0]

function inputClass() {
  return "w-full h-9 rounded-lg border border-edge-strong bg-layer-2 px-2.5 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_var(--secondary-soft)]"
}

function labelClass() {
  return "text-[11px] text-ink-dim font-medium uppercase tracking-wider"
}

function tableHeaderClass() {
  return "px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.08em] text-ink-muted font-semibold"
}

export function VgcSmogonFetcher() {
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ''
  const [snapshots, setSnapshots] = useState<SmogonSnapshot[]>([])
  const [loading,   setLoading]   = useState(false)
  const [fetching,  setFetching]  = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState<string | null>(null)
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])

  const [format, setFormat] = useState("")
  const [month,  setMonth]  = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const [cutoff, setCutoff] = useState(1760)

  const loadSnapshots = () => {
    setLoading(true)
    VgcMetaService.getAvailableSnapshots()
      .then((res) => setSnapshots(res.data ?? []))
      .catch(() => setError("No se pudieron cargar los snapshots."))
      .finally(() => setLoading(false))
  }

  const loadRegulations = () => {
    VgcMetaService.getAvailableChampionsRegulations()
      .then((res) => {
        const regs = res.data ?? []
        setRegulations(regs)
        if (!format && regs.length > 0) {
          setFormat(regs[0].formatId)
        }
      })
      .catch(() => setError("No se pudieron cargar las regulaciones."))
  }

  useEffect(() => {
    loadSnapshots()
    loadRegulations()
  }, [])

  useEffect(() => {
    const onRegulationsUpdated = () => loadRegulations()
    window.addEventListener("vgc-regulations-updated", onRegulationsUpdated)
    return () => {
      window.removeEventListener("vgc-regulations-updated", onRegulationsUpdated)
    }
  }, [])

  const handleFetch = async () => {
    setFetching(true)
    setError(null)
    setSuccess(null)
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.")
      setFetching(false)
      return
    }
    if (!format) {
      setError("No hay formato disponible. Registra primero una regulación en Champions.")
      setFetching(false)
      return
    }
    try {
      const res = await VgcMetaService.fetchSmogonSnapshot(format, month, cutoff, token)
      setSuccess(`Importados ${res.data?.count ?? 0} Pokémon.`)
      loadSnapshots()
    } catch {
      setError("Error al importar el snapshot.")
    } finally {
      setFetching(false)
    }
  }

  const handleDelete = async (s: SmogonSnapshot) => {
    setDeletingId(s.id)
    setError(null)
    setSuccess(null)
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.")
      setDeletingId(null)
      return
    }
    try {
      await VgcMetaService.deleteSmogonSnapshot(s.formatId, s.month, s.cutoff, token)
      setSuccess(`Snapshot ${s.formatId} ${s.month}-${s.cutoff} eliminado.`)
      loadSnapshots()
    } catch {
      setError("Error al eliminar el snapshot.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-ink-muted">
        Importa stats.txt + moveset.txt de Smogon y normaliza los datos en la base de datos.
      </p>

      {/* Existing snapshots */}
      <ToolPanel
        title="Snapshots almacenados"
        headRight={
          <button onClick={loadSnapshots} className="text-ink-dim hover:text-ink transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        }
      >
        {loading ? (
          <div className="py-8 flex justify-center text-ink-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : snapshots.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-dim">Sin snapshots.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-[color-mix(in_srgb,var(--layer-1)_96%,transparent)]">
                <th className={tableHeaderClass()}>Formato</th>
                <th className={tableHeaderClass()}>Mes</th>
                <th className={tableHeaderClass()}>Cutoff</th>
                <th className={tableHeaderClass()}>Pkm</th>
                <th className={tableHeaderClass()}>Importado</th>
                <th className={tableHeaderClass()} />
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-b border-edge hover:bg-[color-mix(in_srgb,var(--text)_3%,transparent)] transition-colors">
                  <td className="px-4 py-2 text-ink font-mono text-xs">{s.formatId}</td>
                  <td className="px-4 py-2 text-ink-muted">{s.month}</td>
                  <td className="px-4 py-2 text-ink-muted">{s.cutoff === 0 ? "0 (all)" : `${s.cutoff}+`}</td>
                  <td className="px-4 py-2 text-ink-muted">{s.pokemonCount}</td>
                  <td className="px-4 py-2 text-ink-dim text-xs">
                    {new Date(s.fetchedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deletingId === s.id}
                      className="text-ink-dim hover:text-red-400 disabled:opacity-40 transition-colors"
                      title="Eliminar snapshot"
                    >
                      {deletingId === s.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ToolPanel>

      {/* Fetch form */}
      <ToolPanel title="Importar nuevo snapshot">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className={labelClass()}>Formato</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={inputClass()}
            >
              {regulations.map((r) => (
                <option key={r.id} value={r.formatId}>{r.name} · {r.formatId}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelClass()}>Mes (YYYY-MM)</label>
            <input
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="2026-03"
              pattern="\d{4}-\d{2}"
              className={inputClass()}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClass()}>Cutoff</label>
            <select
              value={cutoff}
              onChange={(e) => setCutoff(Number(e.target.value))}
              className={inputClass()}
            >
              {CUTOFF_OPTIONS.map((c) => (
                <option key={c} value={c}>{c === 0 ? "0 (all)" : `${c}+`}</option>
              ))}
            </select>
          </div>
        </div>

        {error   && <p className="text-xs text-red-400 mt-2">{error}</p>}
        {success && <p className="text-xs text-emerald-400 mt-2">{success}</p>}

        <div className="mt-3">
          <BoffButton onClick={handleFetch} disabled={fetching || !format}>
            {fetching ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>
            ) : (
              "Importar snapshot"
            )}
          </BoffButton>
        </div>
      </ToolPanel>
    </div>
  )
}
