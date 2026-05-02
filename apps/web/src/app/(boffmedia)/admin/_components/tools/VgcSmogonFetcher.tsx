"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { ChampionsRegulation, SmogonSnapshot, VgcMetaService } from "@/services/api/boffmedia/vgcService";
import { useBoffSession } from "@/services/useBoffSession";

const CUTOFF_OPTIONS = [1760, 1630, 1500, 0];

export function VgcSmogonFetcher() {
    const { session } = useBoffSession();
    const token = session?.user?.accessToken ?? '';
  const [snapshots, setSnapshots] = useState<SmogonSnapshot[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([]);

  const [format, setFormat] = useState("");
  const [month,  setMonth]  = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [cutoff, setCutoff] = useState(1760);

  const loadSnapshots = () => {
    setLoading(true);
    VgcMetaService.getAvailableSnapshots()
      .then((res) => setSnapshots(res.data ?? []))
      .catch(() => setError("No se pudieron cargar los snapshots."))
      .finally(() => setLoading(false));
  };

  const loadRegulations = () => {
    VgcMetaService.getAvailableChampionsRegulations()
      .then((res) => {
        const regs = res.data ?? [];
        setRegulations(regs);
        if (!format && regs.length > 0) {
          setFormat(regs[0].formatId);
        }
      })
      .catch(() => setError("No se pudieron cargar las regulaciones."));
  };

  useEffect(() => {
    loadSnapshots();
    loadRegulations();
  }, []);

  useEffect(() => {
    const onRegulationsUpdated = () => loadRegulations();
    window.addEventListener("vgc-regulations-updated", onRegulationsUpdated);
    return () => {
      window.removeEventListener("vgc-regulations-updated", onRegulationsUpdated);
    };
  }, []);

  const handleFetch = async () => {
    setFetching(true);
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.");
      setFetching(false);
      return;
    }
    if (!format) {
      setError("No hay formato disponible. Registra primero una regulación en Champions.");
      setFetching(false);
      return;
    }
    try {
      const res = await VgcMetaService.fetchSmogonSnapshot(format, month, cutoff, token);
      setSuccess(`Importados ${res.data?.count ?? 0} Pokémon.`);
      loadSnapshots();
    } catch {
      setError("Error al importar el snapshot.");
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (s: SmogonSnapshot) => {
    setDeletingId(s.id);
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.");
      setDeletingId(null);
      return;
    }
    try {
      await VgcMetaService.deleteSmogonSnapshot(s.formatId, s.month, s.cutoff, token);
      setSuccess(`Snapshot ${s.formatId} ${s.month}-${s.cutoff} eliminado.`);
      loadSnapshots();
    } catch {
      setError("Error al eliminar el snapshot.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-surface-400">
        Importa stats.txt + moveset.txt de Smogon y normaliza los datos en la base de datos.
      </p>

      {/* Existing snapshots */}
      <div className="rounded-xl border border-surface-700/80 bg-surface-800/50 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-surface-900/50 border-b border-surface-700/60 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-surface-500">
            Snapshots almacenados
          </span>
          <button
            onClick={loadSnapshots}
            className="text-surface-500 hover:text-surface-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {loading ? (
          <div className="py-8 flex justify-center text-surface-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : snapshots.length === 0 ? (
          <p className="py-6 text-center text-xs text-surface-600">Sin snapshots.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700/60 bg-surface-900/95">
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.08em] text-surface-500 font-semibold">Formato</th>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.08em] text-surface-500 font-semibold">Mes</th>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.08em] text-surface-500 font-semibold">Cutoff</th>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.08em] text-surface-500 font-semibold">Pkm</th>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.08em] text-surface-500 font-semibold">Importado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-b border-surface-700/35 hover:bg-surface-700/20 transition-colors">
                  <td className="px-4 py-2 text-surface-200 font-mono text-xs">{s.formatId}</td>
                  <td className="px-4 py-2 text-surface-300">{s.month}</td>
                  <td className="px-4 py-2 text-surface-300">{s.cutoff === 0 ? "0 (all)" : `${s.cutoff}+`}</td>
                  <td className="px-4 py-2 text-surface-300">{s.pokemonCount}</td>
                  <td className="px-4 py-2 text-surface-500 text-xs">
                    {new Date(s.fetchedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deletingId === s.id}
                      className="text-surface-600 hover:text-red-400 disabled:opacity-40 transition-colors"
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
      </div>

      {/* Fetch form */}
      <div className="rounded-xl border border-surface-700/80 bg-surface-800/50 shadow-sm p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-surface-500">
          Importar nuevo snapshot
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-surface-500 font-medium uppercase tracking-wider">
              Formato
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full h-9 rounded-lg border border-surface-700/80 bg-surface-800/75 px-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
            >
              {regulations.map((r) => (
                <option key={r.id} value={r.formatId}>{r.name} · {r.formatId}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-surface-500 font-medium uppercase tracking-wider">
              Mes (YYYY-MM)
            </label>
            <input
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="2026-03"
              pattern="\d{4}-\d{2}"
              className="w-full h-9 rounded-lg border border-surface-700/80 bg-surface-800/75 px-2.5 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-surface-500 font-medium uppercase tracking-wider">
              Cutoff
            </label>
            <select
              value={cutoff}
              onChange={(e) => setCutoff(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-surface-700/80 bg-surface-800/75 px-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
            >
              {CUTOFF_OPTIONS.map((c) => (
                <option key={c} value={c}>{c === 0 ? "0 (all)" : `${c}+`}</option>
              ))}
            </select>
          </div>
        </div>

        {error   && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-green-400">{success}</p>}

        <Button onClick={handleFetch} disabled={fetching || !format} className="w-full sm:w-auto">
          {fetching ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>
          ) : (
            "Importar snapshot"
          )}
        </Button>
      </div>
    </div>
  );
}
