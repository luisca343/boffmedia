"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { VgcMetaService, SmogonSnapshot } from "@/services/api/boffmedia/vgcService";
import { useBoffSession } from "@/services/useBoffSession";

const FORMAT_OPTIONS = [
  { id: "gen9vgc2026regi", label: "VGC 2026 Reg I" },
  { id: "gen9vgc2026regh", label: "VGC 2026 Reg H" },
  { id: "gen9vgc2026regg", label: "VGC 2026 Reg G" },
  { id: "gen9vgc2026regf", label: "VGC 2026 Reg F" },
];

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

  const [format, setFormat] = useState(FORMAT_OPTIONS[0].id);
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

  useEffect(() => { loadSnapshots(); }, []);

  const handleFetch = async () => {
    setFetching(true);
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.");
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-surface-50 mb-1">VGC Meta — Smogon</h2>
        <p className="text-sm text-surface-400">
          Importa stats.txt + moveset.txt de Smogon y normaliza los datos en la base de datos.
        </p>
      </div>

      {/* Existing snapshots */}
      <div className="rounded-xl border border-surface-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
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
              <tr className="border-b border-surface-800">
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Formato</th>
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Mes</th>
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Cutoff</th>
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Pkm</th>
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Importado</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-b border-surface-800/50 hover:bg-surface-900/40">
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
      <div className="rounded-xl border border-surface-800 p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
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
              className="w-full h-9 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {FORMAT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
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
              className="w-full h-9 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-surface-500 font-medium uppercase tracking-wider">
              Cutoff
            </label>
            <select
              value={cutoff}
              onChange={(e) => setCutoff(Number(e.target.value))}
              className="w-full h-9 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {CUTOFF_OPTIONS.map((c) => (
                <option key={c} value={c}>{c === 0 ? "0 (all)" : `${c}+`}</option>
              ))}
            </select>
          </div>
        </div>

        {error   && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-green-400">{success}</p>}

        <Button onClick={handleFetch} disabled={fetching} className="w-full sm:w-auto">
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
