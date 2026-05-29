'use client';

import { useState, useEffect, useMemo } from 'react';
import { WingullService, PlotEntry } from '@/services/api/smartrotom/wingullService';
import { RefreshCw, Search, ShieldAlert, MapPin, X } from 'lucide-react';
import { StandardizedMap, CoordinateTransformer, MAP_CONSTANTS } from '@/components/shared/map/StandardizedMap';
import { BaseMarker } from '@/components/shared/map/BaseMarker';

function formatTownName(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type FilterStatus = 'all' | 'claimed' | 'unclaimed';

export default function PoliciaApp() {
  const [parcelas, setParcelas] = useState<PlotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedPlot, setSelectedPlot] = useState<PlotEntry | null>(null);
  const [mapCenter, setMapCenter] = useState({ x: 0, z: 0 });
  const [mapZoom, setMapZoom] = useState(0.8);

  const transformer = useMemo(
    () => new CoordinateTransformer(MAP_CONSTANTS.WORLD_BOUNDS),
    [],
  );

  const handlePlotClick = (p: PlotEntry) => {
    if (p.centerX == null || p.centerZ == null) return;
    setSelectedPlot(p);
    setMapCenter({ x: p.centerX, z: p.centerZ });
    setMapZoom(0.8);
  };

  const fetchParcelas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await WingullService.getPlots();
      if (res.data) {
        setParcelas(res.data);
      } else {
        setError('No se pudieron cargar las parcelas.');
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcelas();
  }, []);

  const filtered = parcelas.filter((p) => {
    const matchesSearch =
      !search ||
      formatTownName(p.town).toLowerCase().includes(search.toLowerCase()) ||
      String(p.number).includes(search) ||
      (p.owner?.username ?? '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'claimed' && !!p.owner) ||
      (statusFilter === 'unclaimed' && !p.owner);

    return matchesSearch && matchesStatus;
  });

  // Group by town
  const byTown = filtered.reduce<Record<string, PlotEntry[]>>((acc, p) => {
    acc[p.town] = acc[p.town] ?? [];
    acc[p.town].push(p);
    return acc;
  }, {});

  const claimedCount = parcelas.filter((p) => !!p.owner).length;
  const freeCount = parcelas.filter((p) => !p.owner).length;

  return (
    <div className="w-full max-w-[340px] min-h-[500px] bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-blue-800 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-yellow-300" />
          <h2 className="text-white text-base font-bold tracking-wide">Registro de Parcelas</h2>
        </div>
        <button
          onClick={fetchParcelas}
          disabled={loading}
          className="text-white hover:bg-blue-700 rounded-full p-1 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats bar */}
      {!loading && !error && (
        <div className="flex divide-x divide-surface-200 border-b border-surface-200 bg-surface-50">
          <div className="flex-1 text-center py-1.5">
            <p className="text-xs text-surface-500">Total</p>
            <p className="text-sm font-bold text-surface-800">{parcelas.length}</p>
          </div>
          <div className="flex-1 text-center py-1.5">
            <p className="text-xs text-surface-500">Ocupadas</p>
            <p className="text-sm font-bold text-red-600">{claimedCount}</p>
          </div>
          <div className="flex-1 text-center py-1.5">
            <p className="text-xs text-surface-500">Libres</p>
            <p className="text-sm font-bold text-green-600">{freeCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-2 flex flex-col gap-2 border-b border-surface-200 bg-surface-50">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pueblo, nº, jugador..."
            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-surface-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'claimed', 'unclaimed'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-800 text-white'
                  : 'bg-white border border-surface-300 text-surface-600 hover:bg-surface-100'
              }`}
            >
              {s === 'all' ? 'Todas' : s === 'claimed' ? 'Ocupadas' : 'Libres'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-800" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && Object.keys(byTown).length === 0 && (
          <div className="text-center py-8 text-surface-400 text-sm">Sin resultados</div>
        )}

        {!loading && !error &&
          Object.entries(byTown)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([town, plots]) => (
              <div key={town} className="mb-3">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1 px-1">
                  {formatTownName(town)}
                  <span className="ml-1 text-surface-400 normal-case font-normal">({plots.length})</span>
                </p>
                <div className="space-y-1">
                  {plots
                    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
                    .map((p) => (
                      <div
                        key={`${p.town}-${p.number}`}
                        className={`flex items-center justify-between border rounded-lg px-2.5 py-1.5 transition-colors ${
                          p.centerX != null
                            ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/40'
                            : ''
                        } ${
                          selectedPlot?.town === p.town && selectedPlot?.number === p.number
                            ? 'border-blue-500 bg-blue-50'
                            : 'bg-surface-50 border-surface-200'
                        }`}
                        onClick={() => handlePlotClick(p)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-surface-700 w-8 text-right">
                            #{p.number ?? '?'}
                          </span>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${p.owner ? 'bg-red-500' : 'bg-green-500'}`}
                          />
                        </div>
                        <div className="flex-1 ml-2 min-w-0">
                          {p.owner ? (
                            <p
                              className="text-xs text-surface-700 font-medium truncate"
                              title={p.owner.uuid}
                            >
                              {p.owner.username}
                            </p>
                          ) : (
                            <p className="text-xs font-medium text-green-600">Libre</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-1">
                          {p.centerX != null && (
                            <MapPin
                              className={`h-3 w-3 ${
                                selectedPlot?.town === p.town && selectedPlot?.number === p.number
                                  ? 'text-blue-500'
                                  : 'text-surface-400'
                              }`}
                            />
                          )}
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              p.owner
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {p.owner ? 'Ocupada' : 'Libre'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
      </div>

      {/* Map Panel */}
      {selectedPlot && selectedPlot.centerX != null && selectedPlot.centerZ != null && (
        <div className="border-t border-surface-200 flex-shrink-0">
          <div className="flex items-center justify-between px-2 py-1 bg-blue-50">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-blue-700" />
              <span className="text-xs font-semibold text-blue-800">
                {formatTownName(selectedPlot.town)} #{selectedPlot.number ?? '?'}
              </span>
              <span className="text-[10px] text-surface-400">
                ({selectedPlot.centerX}, {selectedPlot.centerZ})
              </span>
            </div>
            <button
              onClick={() => setSelectedPlot(null)}
              className="text-surface-400 hover:text-surface-700 p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-[180px]">
            <StandardizedMap
              mapCenter={mapCenter}
              zoomLevel={mapZoom}
              onMapCenterChange={setMapCenter}
              onZoomChange={setMapZoom}
              className="h-full"
              showControls
              minZoom={0.2}
              maxZoom={3}
            >
              <BaseMarker
                worldPosition={{ x: selectedPlot.centerX, z: selectedPlot.centerZ }}
                transformer={transformer}
              >
                <MapPin className="h-5 w-5 text-red-500 drop-shadow" style={{ marginTop: '-20px' }} />
              </BaseMarker>
            </StandardizedMap>
          </div>
        </div>
      )}
    </div>
  );
}
