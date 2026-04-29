"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { BatchFetchResult, VgcMetaService, ChampionsRegulation } from "@/services/api/boffmedia/vgcService";
import { useBoffSession } from "@/services/useBoffSession";

const REGULATION_OPTIONS: Array<{ id: string; name: string }> = [
  { id: "vgc2026regma", name: "[Gen 9 Champions] VGC 2026 Reg M-A" },
];

export function VgcChampionsFetcher() {
  const { session } = useBoffSession();
  const token = session?.user?.accessToken ?? '';

  const [available,      setAvailable]      = useState<ChampionsRegulation[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [refreshing,     setRefreshing]     = useState<string | null>(null);
  const [fetchingPastes, setFetchingPastes] = useState<string | null>(null);
  const [error,          setError]          = useState<string | null>(null);
  const [success,        setSuccess]        = useState<string | null>(null);

  const loadAvailable = () => {
    setLoading(true);
    VgcMetaService.getAvailableChampionsRegulations()
      .then((res) => setAvailable(res.data ?? []))
      .catch(() => setError("No se pudo cargar el estado de Champions."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAvailable(); }, []);

  const handleRefresh = async (regulationId: string) => {
    setRefreshing(regulationId);
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.");
      setRefreshing(null);
      return;
    }
    try {
      const res = await VgcMetaService.refreshChampions(regulationId, token);
      setSuccess(`Importados ${res.data?.count ?? 0} equipos para ${regulationId}.`);
      loadAvailable();
    } catch {
      setError("Error al importar los datos de Champions.");
    } finally {
      setRefreshing(null);
    }
  };

  const handleFetchPastes = async (regulationId: string) => {
    setFetchingPastes(regulationId);
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.");
      setFetchingPastes(null);
      return;
    }
    try {
      const res = await VgcMetaService.fetchChampionsPastes(regulationId, token);
      const r = res.data as BatchFetchResult | undefined;
      setSuccess(
        r
          ? `Descargados ${r.fetched} pastes (${r.cached} en caché, ${r.failed} fallidos) de ${r.total} equipos.`
          : `Pastes descargados para ${regulationId}.`,
      );
    } catch {
      setError("Error al descargar los pastes.");
    } finally {
      setFetchingPastes(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-surface-50 mb-1">VGC Meta — Champions</h2>
        <p className="text-sm text-surface-400">
          Importa datos del CSV de VGCPastes (Google Sheets). Agrega uso por especie y co-aparición de compañeros de equipo. Los equipos individuales se guardan en <code className="text-surface-500">vgc_paste_teams</code>.
        </p>
      </div>

      {/* Regulation table */}
      <div className="rounded-xl border border-surface-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
            Regulaciones configuradas
          </span>
          <button
            onClick={loadAvailable}
            className="text-surface-500 hover:text-surface-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center text-surface-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Regulación</th>
                <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-surface-500 font-medium">Estado</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {REGULATION_OPTIONS.map((reg) => {
                const hasData       = available.some((a) => a.id === reg.id);
                const isRefreshing  = refreshing === reg.id;
                const isFetching    = fetchingPastes === reg.id;
                return (
                  <tr key={reg.id} className="border-b border-surface-800/50 hover:bg-surface-900/40">
                    <td className="px-4 py-3">
                      <p className="text-surface-200 text-xs font-medium">{reg.name}</p>
                      <p className="text-surface-600 text-[11px] font-mono">{reg.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      {hasData ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Importado
                        </span>
                      ) : (
                        <span className="text-xs text-surface-600">Sin datos</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefresh(reg.id)}
                          disabled={isRefreshing || isFetching}
                        >
                          {isRefreshing ? (
                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Importando...</>
                          ) : (
                            <><RefreshCw className="w-3 h-3 mr-1.5" />Importar CSV</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFetchPastes(reg.id)}
                          disabled={!hasData || isRefreshing || isFetching}
                        >
                          {isFetching ? (
                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Descargando...</>
                          ) : (
                            <><Download className="w-3 h-3 mr-1.5" />Fetch Pastes</>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {error   && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-green-400">{success}</p>}

      <p className="text-xs text-surface-600">
        Fuente: Google Sheets VGCPastes · GID por regulación en{" "}
        <code className="text-surface-500">champions-data.ts</code> · Añadir nueva regulación: crear entrada en ese archivo y actualizar <code className="text-surface-500">REGULATION_OPTIONS</code> aquí.
      </p>
    </div>
  );
}
