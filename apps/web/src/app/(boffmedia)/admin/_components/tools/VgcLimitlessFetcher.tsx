"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import {
  LimitlessTournament,
  LimitlessImportJobStatus,
  VgcMetaService,
} from "@/services/api/boffmedia/vgcService";
import { useBoffSession } from "@/services/useBoffSession";

const REGULATION_OPTIONS: Array<{ id: string; name: string }> = [
  { id: "vgc2026regma", name: "VGC 2026 Reg M-A" },
];

function StatusDot({ status }: { status: LimitlessTournament["status"] }) {
  if (status === "running")
    return <Loader2 className="w-3 h-3 animate-spin text-amber-400 inline" />;
  if (status === "done")
    return <CheckCircle2 className="w-3 h-3 text-green-400 inline" />;
  if (status === "error")
    return <AlertCircle className="w-3 h-3 text-red-400 inline" />;
  return <span className="w-2 h-2 rounded-full bg-surface-600 inline-block" />;
}

function ProgressBar({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-surface-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-surface-500 tabular-nums">{progress}/{total}</span>
    </div>
  );
}

export function VgcLimitlessFetcher() {
  const { session } = useBoffSession();
  const token = session?.user?.accessToken ?? '';

  const [url,          setUrl]          = useState("");
  const [regulationId, setRegulationId] = useState(REGULATION_OPTIONS[0].id);
  const [maxPlayers,   setMaxPlayers]   = useState<string>("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);

  const [tournaments, setTournaments]   = useState<LimitlessTournament[]>([]);
  const [loadingList, setLoadingList]   = useState(false);

  // polling for running jobs
  const pollingRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());

  const loadTournaments = (regId = regulationId) => {
    setLoadingList(true);
    VgcMetaService.getLimitlessTournaments(regId)
      .then((res) => setTournaments(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    loadTournaments();
    return () => {
      pollingRef.current.forEach((id) => clearInterval(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regulationId]);

  const startPolling = (tournamentId: number) => {
    if (pollingRef.current.has(tournamentId)) return;
    const interval = setInterval(async () => {
      try {
        const res = await VgcMetaService.getLimitlessTournamentStatus(tournamentId);
        const job = res.data as LimitlessImportJobStatus | undefined;
        if (!job) return;
        // update the local list entry
        setTournaments((prev) =>
          prev.map((t) =>
            t.id === tournamentId
              ? { ...t, status: job.status as LimitlessTournament["status"], progress: job.progress, total: job.total, errorMessage: job.errorMessage ?? null }
              : t,
          ),
        );
        if (job.status === "done" || job.status === "error") {
          clearInterval(pollingRef.current.get(tournamentId));
          pollingRef.current.delete(tournamentId);
        }
      } catch { /* ignore */ }
    }, 3000);
    pollingRef.current.set(tournamentId, interval);
  };

  const handleSubmit = async () => {
    if (!url.trim()) { setError("Introduce la URL del torneo."); return; }
    const max = maxPlayers.trim() ? parseInt(maxPlayers, 10) : undefined;
    if (max !== undefined && (isNaN(max) || max < 1)) {
      setError("Max jugadores debe ser un número positivo.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await VgcMetaService.importLimitlessTournament(url.trim(), regulationId, token, max);
      const tournamentId = res.data?.tournamentId;
      if (tournamentId) {
        setSuccess(`Importación iniciada (ID #${tournamentId}). Procesando en segundo plano...`);
        setUrl("");
        setMaxPlayers("");
        // Reload list then start polling
        loadTournaments();
        startPolling(tournamentId);
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Error al iniciar la importación.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-surface-50 mb-1">VGC Meta — Limitless</h2>
        <p className="text-sm text-surface-400">
          Importa torneos de{" "}
          <a
            href="https://play.limitlesstcg.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:underline"
          >
            Limitless TCG
          </a>{" "}
          para agregar estadísticas de uso de los decklists VGC. Solo se necesitan 2 peticiones a la API por torneo.
        </p>
      </div>

      {/* Import form */}
      <div className="rounded-xl border border-surface-800 p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
          Importar torneo
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-surface-400 mb-1">URL del torneo</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://play.limitlesstcg.com/tournament/..."
              className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-surface-400 mb-1">Regulación</label>
              <select
                value={regulationId}
                onChange={(e) => setRegulationId(e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-amber-500/50"
              >
                {REGULATION_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1">
                Max jugadores{" "}
                <span className="text-surface-600">(opcional)</span>
              </label>
              <input
                type="number"
                min={1}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="Todos"
                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !url.trim()}
          className="w-full"
        >
          {submitting ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Iniciando...</>
          ) : (
            <><Upload className="w-3 h-3 mr-1.5" />Importar torneo</>
          )}
        </Button>

        {error   && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-green-400">{success}</p>}
      </div>

      {/* Tournament list */}
      <div className="rounded-xl border border-surface-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
            Torneos importados
          </span>
          <button
            onClick={() => loadTournaments()}
            className="text-surface-500 hover:text-surface-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingList ? (
          <div className="py-8 flex justify-center text-surface-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-surface-600">
            No hay torneos importados para esta regulación.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Torneo</th>
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Estado</th>
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Jugadores</th>
              </tr>
            </thead>
            <tbody>
              {[...tournaments].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).map((t) => (
                <tr key={t.id} className="border-b border-surface-800/50 hover:bg-surface-900/40">
                  <td className="px-4 py-3">
                    <p className="text-surface-200 text-xs font-medium">{t.name ?? t.limitlessId}</p>
                    <p className="text-surface-600 text-[11px] font-mono">{t.date ?? "—"} · {t.format ?? "—"}</p>
                    {t.errorMessage && (
                      <p className="text-red-400 text-[11px] mt-0.5 truncate max-w-xs">{t.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <StatusDot status={t.status} />
                      <span className="text-surface-400">
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
                  <td className="px-4 py-3 text-xs text-surface-400">
                    {t.playerCount ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-surface-600">
        Fuente: Limitless TCG API · 2 peticiones por torneo · Los decklists VGC son JSON estructurado (no texto Showdown).
      </p>
    </div>
  );
}
