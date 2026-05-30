'use client';

import { useState, useEffect, useMemo } from 'react';
import { WingullService, PlotEntry } from '@/services/api/smartrotom/wingullService';
import {
  RefreshCw, Search, ShieldAlert, MapPin, X,
  FileText, AlertTriangle, DollarSign, Users, Clock, Plus, ChevronDown,
} from 'lucide-react';
import { StandardizedMap, CoordinateTransformer, MAP_CONSTANTS } from '@/components/shared/map/StandardizedMap';
import { BaseMarker } from '@/components/shared/map/BaseMarker';

function formatTownName(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type FilterStatus = 'all' | 'claimed' | 'unclaimed';
type Tab = 'parcelas' | 'denuncias' | 'buscados' | 'multas' | 'oficiales' | 'historial';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'parcelas', label: 'Parcelas', icon: MapPin },
  { id: 'denuncias', label: 'Denuncias', icon: FileText },
  { id: 'buscados', label: 'Buscados', icon: AlertTriangle },
  { id: 'multas', label: 'Multas', icon: DollarSign },
  { id: 'oficiales', label: 'Oficiales', icon: Users },
  { id: 'historial', label: 'Historial', icon: Clock },
];

export default function PoliciaApp() {
  const [activeTab, setActiveTab] = useState<Tab>('parcelas');

  // Parcelas state
  const [parcelas, setParcelas] = useState<PlotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedPlot, setSelectedPlot] = useState<PlotEntry | null>(null);
  const [mapCenter, setMapCenter] = useState({ x: 0, z: 0 });
  const [mapZoom, setMapZoom] = useState(0.8);

  // Denuncias state
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [denunciasLoading, setDenunciasLoading] = useState(false);
  const [showCreateDenuncia, setShowCreateDenuncia] = useState(false);
  const [denunciaForm, setDenunciaForm] = useState({ town: '', plotNumber: '', category: 'griefing', description: '', accusedUsername: '' });

  // Buscados state
  const [buscados, setBuscados] = useState<any[]>([]);
  const [buscadosLoading, setBuscadosLoading] = useState(false);

  // Multas state
  const [multas, setMultas] = useState<any[]>([]);
  const [multasLoading, setMultasLoading] = useState(false);

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

  const fetchDenuncias = async () => {
    setDenunciasLoading(true);
    try {
      const res = await WingullService.getPoliciaDenuncias();
      if (res.data) setDenuncias(res.data);
    } finally {
      setDenunciasLoading(false);
    }
  };

  const fetchBuscados = async () => {
    setBuscadosLoading(true);
    try {
      const res = await WingullService.getPoliciaBuscados();
      if (res.data) setBuscados(res.data);
    } finally {
      setBuscadosLoading(false);
    }
  };

  const fetchMultas = async () => {
    setMultasLoading(true);
    try {
      const res = await WingullService.getPoliciaMultas();
      if (res.data) setMultas(res.data);
    } finally {
      setMultasLoading(false);
    }
  };

  useEffect(() => {
    fetchParcelas();
  }, []);

  useEffect(() => {
    if (activeTab === 'denuncias' && denuncias.length === 0) fetchDenuncias();
    if (activeTab === 'buscados' && buscados.length === 0) fetchBuscados();
    if (activeTab === 'multas' && multas.length === 0) fetchMultas();
  }, [activeTab]);

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

  const byTown = filtered.reduce<Record<string, PlotEntry[]>>((acc, p) => {
    acc[p.town] = acc[p.town] ?? [];
    acc[p.town].push(p);
    return acc;
  }, {});

  const claimedCount = parcelas.filter((p) => !!p.owner).length;
  const freeCount = parcelas.filter((p) => !p.owner).length;

  return (
    <div className="w-full min-h-[600px] bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-blue-800 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-yellow-300" />
          <h2 className="text-white text-base font-bold tracking-wide">Policía</h2>
        </div>
        {activeTab === 'parcelas' && (
          <button
            onClick={fetchParcelas}
            disabled={loading}
            className="text-white hover:bg-blue-700 rounded-full p-1 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
        {activeTab === 'denuncias' && (
          <button onClick={fetchDenuncias} className="text-white hover:bg-blue-700 rounded-full p-1">
            <RefreshCw className={`h-4 w-4 ${denunciasLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
        {activeTab === 'buscados' && (
          <button onClick={fetchBuscados} className="text-white hover:bg-blue-700 rounded-full p-1">
            <RefreshCw className={`h-4 w-4 ${buscadosLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
        {activeTab === 'multas' && (
          <button onClick={fetchMultas} className="text-white hover:bg-blue-700 rounded-full p-1">
            <RefreshCw className={`h-4 w-4 ${multasLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-surface-200 bg-surface-50 flex-shrink-0 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-blue-700 text-blue-800 bg-white'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:bg-surface-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'parcelas' && (
          <>
            {/* Stats bar */}
            {!loading && !error && (
              <div className="flex divide-x divide-surface-200 border-b border-surface-200 bg-surface-50 flex-shrink-0">
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
            <div className="p-2 flex flex-col gap-2 border-b border-surface-200 bg-surface-50 flex-shrink-0">
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

            {/* Plot List */}
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
                                  <p className="text-xs text-surface-700 font-medium truncate" title={p.owner.uuid}>
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
                <div className="h-[240px]">
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
          </>
        )}

        {/* ======================== DENUNCIAS TAB ======================== */}
        {activeTab === 'denuncias' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-surface-200 bg-surface-50 flex-shrink-0">
              <span className="text-xs font-semibold text-surface-700">{denuncias.length} denuncia{denuncias.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => setShowCreateDenuncia((v) => !v)}
                className="flex items-center gap-1 text-xs bg-blue-800 text-white px-2 py-1 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-3 w-3" />
                Nueva
              </button>
            </div>

            {showCreateDenuncia && (
              <div className="p-3 border-b border-surface-200 bg-blue-50 flex-shrink-0 space-y-2">
                <p className="text-xs font-semibold text-blue-800 mb-1">Nueva Denuncia</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Pueblo"
                    value={denunciaForm.town}
                    onChange={(e) => setDenunciaForm((f) => ({ ...f, town: e.target.value }))}
                    className="col-span-1 text-xs border border-surface-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    placeholder="Nº Parcela"
                    type="number"
                    value={denunciaForm.plotNumber}
                    onChange={(e) => setDenunciaForm((f) => ({ ...f, plotNumber: e.target.value }))}
                    className="col-span-1 text-xs border border-surface-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <input
                  placeholder="Acusado (usuario)"
                  value={denunciaForm.accusedUsername}
                  onChange={(e) => setDenunciaForm((f) => ({ ...f, accusedUsername: e.target.value }))}
                  className="w-full text-xs border border-surface-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={denunciaForm.category}
                  onChange={(e) => setDenunciaForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full text-xs border border-surface-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="griefing">Griefing</option>
                  <option value="theft">Robo</option>
                  <option value="dispute">Disputa</option>
                  <option value="other">Otro</option>
                </select>
                <textarea
                  placeholder="Descripción..."
                  value={denunciaForm.description}
                  onChange={(e) => setDenunciaForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full text-xs border border-surface-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!denunciaForm.town || !denunciaForm.plotNumber || !denunciaForm.description) return;
                      await WingullService.createPoliciaDenuncia({
                        reporterUuid: '',
                        reporterUsername: 'unknown',
                        accusedUsername: denunciaForm.accusedUsername || undefined,
                        town: denunciaForm.town,
                        plotNumber: Number(denunciaForm.plotNumber),
                        category: denunciaForm.category,
                        description: denunciaForm.description,
                      });
                      setDenunciaForm({ town: '', plotNumber: '', category: 'griefing', description: '', accusedUsername: '' });
                      setShowCreateDenuncia(false);
                      fetchDenuncias();
                    }}
                    className="flex-1 text-xs bg-blue-800 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Enviar
                  </button>
                  <button
                    onClick={() => setShowCreateDenuncia(false)}
                    className="text-xs border border-surface-300 px-2 py-1 rounded text-surface-600 hover:bg-surface-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {denunciasLoading && (
                <div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-blue-800" /></div>
              )}
              {!denunciasLoading && denuncias.length === 0 && (
                <div className="text-center py-10 text-surface-400 text-sm">Sin denuncias registradas</div>
              )}
              {denuncias.map((d: any) => (
                <div key={d.id} className="border border-surface-200 rounded-lg p-2.5 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-surface-800 truncate">
                        {formatTownName(d.town)} #{d.plotNumber}
                      </p>
                      {d.accusedUsername && (
                        <p className="text-xs text-surface-500 mt-0.5">Acusado: <span className="font-medium text-surface-700">{d.accusedUsername}</span></p>
                      )}
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{d.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        d.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        d.status === 'reviewing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {d.status === 'resolved' ? 'Resuelta' : d.status === 'reviewing' ? 'En revisión' : 'Pendiente'}
                      </span>
                      <span className="text-[10px] bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded-full capitalize">{d.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================== BUSCADOS TAB ======================== */}
        {activeTab === 'buscados' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-surface-200 bg-surface-50 flex-shrink-0">
              <span className="text-xs font-semibold text-surface-700">{buscados.filter((b) => b.status === 'active').length} buscado{buscados.filter((b) => b.status === 'active').length !== 1 ? 's' : ''} activo{buscados.filter((b) => b.status === 'active').length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 gap-3">
              {buscadosLoading && (
                <div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-blue-800" /></div>
              )}
              {!buscadosLoading && buscados.length === 0 && (
                <div className="text-center py-10 text-surface-400 text-sm">No hay buscados activos</div>
              )}
              {buscados.map((b: any) => (
                <div key={b.id} className={`border-2 rounded-xl p-3 ${
                  b.severity === 'critical' ? 'border-red-600 bg-red-50' :
                  b.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  b.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-surface-300 bg-surface-50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-surface-900">{b.playerUsername}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      b.severity === 'critical' ? 'bg-red-600 text-white' :
                      b.severity === 'high' ? 'bg-orange-500 text-white' :
                      b.severity === 'medium' ? 'bg-yellow-500 text-white' :
                      'bg-surface-400 text-white'
                    }`}>
                      {b.severity}
                    </span>
                  </div>
                  <p className="text-xs text-surface-700">{b.offense}</p>
                  {b.notes && <p className="text-[10px] text-surface-500 mt-1 italic">{b.notes}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-surface-400">Reportado por {b.reportedBy}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {b.status === 'active' ? 'Activo' : 'Resuelto'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================== MULTAS TAB ======================== */}
        {activeTab === 'multas' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-surface-200 bg-surface-50 flex-shrink-0 flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-700">{multas.length} multa{multas.length !== 1 ? 's' : ''}</span>
              {multas.length > 0 && (
                <span className="text-xs text-surface-500">
                  Total: <span className="font-bold text-surface-800">
                    ${multas.filter((m) => m.status === 'pending').reduce((s: number, m: any) => s + Number(m.amount), 0).toLocaleString()}
                  </span> pendiente
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {multasLoading && (
                <div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-blue-800" /></div>
              )}
              {!multasLoading && multas.length === 0 && (
                <div className="text-center py-10 text-surface-400 text-sm">Sin multas registradas</div>
              )}
              {multas.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between border border-surface-200 rounded-lg px-2.5 py-2 bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-surface-800 truncate">{m.playerUsername}</p>
                    <p className="text-[10px] text-surface-500 truncate">{m.reason}</p>
                    <p className="text-[10px] text-surface-400">Emitida por {m.issuedBy}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                    <span className="text-sm font-bold text-surface-900">${Number(m.amount).toLocaleString()}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      m.status === 'paid' ? 'bg-green-100 text-green-700' :
                      m.status === 'cancelled' ? 'bg-surface-100 text-surface-500' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {m.status === 'paid' ? 'Pagada' : m.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================== PLACEHOLDERS FOR T8 ======================== */}
        {(activeTab === 'oficiales' || activeTab === 'historial') && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              {(() => {
                const tab = TABS.find((t) => t.id === activeTab)!;
                const Icon = tab.icon;
                return (
                  <>
                    <Icon className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-500 font-medium">{tab.label}</p>
                    <p className="text-surface-400 text-xs mt-1">Próximamente</p>
                  </>
                );
              })()}
            </div>
          </div>
        )}
