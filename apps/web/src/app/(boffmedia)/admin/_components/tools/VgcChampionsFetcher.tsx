"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import {
  BatchFetchResult,
  ChampionsRegulation,
  VgcMetaService,
  VgcRegulationsAdminService,
} from "@/services/api/boffmedia/vgcService";
import { useBoffSession } from "@/services/useBoffSession";

export function VgcChampionsFetcher() {
  const { session } = useBoffSession();
  const token = session?.user?.accessToken ?? '';

  const [available,      setAvailable]      = useState<ChampionsRegulation[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [refreshing,     setRefreshing]     = useState<string | null>(null);
  const [fetchingPastes, setFetchingPastes] = useState<string | null>(null);
  const [error,          setError]          = useState<string | null>(null);
  const [success,        setSuccess]        = useState<string | null>(null);
  const [addingRegulation, setAddingRegulation] = useState(false);

  const [newRegulationId, setNewRegulationId] = useState("");
  const [newFormatId, setNewFormatId] = useState("");
  const [newName, setNewName] = useState("");
  const [newGid, setNewGid] = useState("");

  // When the user types an ID that matches an existing regulation, pre-fill the
  // other fields so a re-save doesn't accidentally overwrite them with blanks.
  useEffect(() => {
    const existing = available.find((r) => r.id === newRegulationId.trim());
    if (!existing) return;
    if (!newFormatId) setNewFormatId(existing.formatId ?? "");
    if (!newName)     setNewName(existing.name ?? "");
    if (!newGid)      setNewGid(existing.vgcPastesGid ?? "");
  }, [newRegulationId, available]);

  const loadAvailable = (silent = false) => {
    if (!silent) setLoading(true);
    VgcMetaService.getAvailableChampionsRegulations()
      .then((res) => setAvailable(res.data ?? []))
      .catch(() => setError("No se pudo cargar el estado de Champions."))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => { loadAvailable(); }, []);

  useEffect(() => {
    if (!refreshing && !fetchingPastes) return;
    const id = setInterval(() => {
      loadAvailable(true);
    }, 2000);
    return () => clearInterval(id);
  }, [refreshing, fetchingPastes]);

  const getStatusLabel = (regulation: ChampionsRegulation | undefined) => {
    switch (regulation?.importStatus) {
      case 'running_csv':
        return { text: 'Importando CSV', className: 'text-amber-400', dot: 'bg-amber-400' };
      case 'running_pastes': {
        const total   = regulation.importTeamCount ?? 0;
        const fetched = regulation.importFetchedCount ?? 0;
        const progress = total > 0 ? ` (${fetched}/${total})` : '';
        return { text: `Descargando pastes${progress}`, className: 'text-sky-400', dot: 'bg-sky-400' };
      }
      case 'done':
        return { text: 'Importado', className: 'text-green-400', dot: 'bg-green-400' };
      case 'error':
        return { text: 'Error', className: 'text-red-400', dot: 'bg-red-400' };
      default:
        return { text: 'Sin datos', className: 'text-surface-600', dot: 'bg-surface-600' };
    }
  };

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
      loadAvailable(true);
      setFetchingPastes(null);
    }
  };

  const handleUpsertRegulation = async () => {
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Sesion invalida: vuelve a iniciar sesion con una cuenta BOFF_ADMIN.");
      return;
    }
    if (!newRegulationId.trim() || !newFormatId.trim() || !newName.trim()) {
      setError("Completa id, formatId y nombre para registrar la regulación.");
      return;
    }

    setAddingRegulation(true);
    try {
      await VgcRegulationsAdminService.upsertRegulation(
        {
          id: newRegulationId.trim(),
          formatId: newFormatId.trim(),
          name: newName.trim(),
          gameType: "doubles",
          vgcPastesGid: newGid.trim() ? newGid.trim() : null,
        },
        token,
      );
      setSuccess(`Regulación ${newRegulationId.trim()} guardada.`);
      setNewRegulationId("");
      setNewFormatId("");
      setNewName("");
      setNewGid("");
      loadAvailable(true);
      window.dispatchEvent(new CustomEvent("vgc-regulations-updated"));
    } catch {
      setError("Error al guardar la regulación.");
    } finally {
      setAddingRegulation(false);
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

      <div className="rounded-xl border border-surface-800 p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
          Registrar regulación
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={newRegulationId}
            onChange={(e) => setNewRegulationId(e.target.value)}
            placeholder="id (ej. vgc2026regf)"
            className="w-full h-9 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <input
            value={newFormatId}
            onChange={(e) => setNewFormatId(e.target.value)}
            placeholder="formatId (ej. gen9vgc2026regf)"
            className="w-full h-9 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre visible"
            className="w-full h-9 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <input
            value={newGid}
            onChange={(e) => setNewGid(e.target.value)}
            placeholder="VGCPastes GID (opcional)"
            className="w-full h-9 rounded-md border border-surface-700 bg-surface-800 px-2.5 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleUpsertRegulation}
          disabled={addingRegulation}
          className="w-full sm:w-auto"
        >
          {addingRegulation ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Guardando...</>
          ) : (
            "Guardar regulación"
          )}
        </Button>
      </div>

      {/* Regulation table */}
      <div className="rounded-xl border border-surface-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
            Regulaciones configuradas
          </span>
          <button
            onClick={() => loadAvailable()}
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
              {available.map((regulation) => {
                const hasData       = (regulation?.importTeamCount ?? 0) > 0;
                const isRefreshing  = refreshing === regulation.id;
                const isFetching    = fetchingPastes === regulation.id;
                const status        = getStatusLabel(regulation);
                return (
                  <tr key={regulation.id} className="border-b border-surface-800/50 hover:bg-surface-900/40">
                    <td className="px-4 py-3">
                      <p className="text-surface-200 text-xs font-medium">{regulation.name}</p>
                      <p className="text-surface-600 text-[11px] font-mono">{regulation.id}</p>
                      <p className="text-surface-600 text-[11px] font-mono">{regulation.formatId}</p>
                      {regulation?.importTeamCount ? (
                        <p className="text-surface-500 text-[11px]">
                          {regulation.importTeamCount} equipos importados
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefresh(regulation.id)}
                          disabled={isRefreshing || isFetching || !regulation.vgcPastesGid}
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
                          onClick={() => handleFetchPastes(regulation.id)}
                          disabled={!hasData || isRefreshing || isFetching || !regulation.vgcPastesGid}
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
