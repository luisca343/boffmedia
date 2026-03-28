'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import { Input } from '@/components/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import {
  Download,
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  SkipForward,
  HardDrive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ScrapeService,
  CatalogResult,
  BulkDownloadResult,
  GameFileEntry,
} from '@/services/api/boffmedia/scrapeService';
import GameCatalogTable from './GameCatalogTable';

// ─── Console metadata ─────────────────────────────────────────────────────────

type Manufacturer = 'Nintendo' | 'Sony';

interface ConsoleInfo {
  label: string;
  shortLabel: string;
  manufacturer: Manufacturer;
}

const CONSOLES: Record<string, ConsoleInfo> = {
  gb:              { label: 'Game Boy',           shortLabel: 'GB',     manufacturer: 'Nintendo' },
  gbc:             { label: 'Game Boy Color',      shortLabel: 'GBC',    manufacturer: 'Nintendo' },
  gba:             { label: 'Game Boy Advance',    shortLabel: 'GBA',    manufacturer: 'Nintendo' },
  n64:             { label: 'Nintendo 64',         shortLabel: 'N64',    manufacturer: 'Nintendo' },
  gamecube:        { label: 'GameCube',            shortLabel: 'GCN',    manufacturer: 'Nintendo' },
  nds:             { label: 'Nintendo DS',         shortLabel: 'NDS',    manufacturer: 'Nintendo' },
  '3ds':           { label: 'Nintendo 3DS',        shortLabel: '3DS',    manufacturer: 'Nintendo' },
  wii:             { label: 'Wii',                 shortLabel: 'Wii',    manufacturer: 'Nintendo' },
  wiiu:            { label: 'Wii U',               shortLabel: 'WiiU',   manufacturer: 'Nintendo' },
  psx:             { label: 'PlayStation',         shortLabel: 'PS1',    manufacturer: 'Sony' },
  ps2:             { label: 'PlayStation 2',       shortLabel: 'PS2',    manufacturer: 'Sony' },
  ps3:             { label: 'PlayStation 3',       shortLabel: 'PS3',    manufacturer: 'Sony' },
  psp:             { label: 'PSP',                 shortLabel: 'PSP',    manufacturer: 'Sony' },
  'psvita-psn':    { label: 'PS Vita (PSN)',        shortLabel: 'Vita',   manufacturer: 'Sony' },
  'psvita-updates':{ label: 'PS Vita (Updates)',   shortLabel: 'VitaU',  manufacturer: 'Sony' },
};

const COMMON_REGIONS = ['USA', 'Europe', 'Japan', 'World', 'Korea', 'Australia'];

// ─── Console picker ───────────────────────────────────────────────────────────

function ConsolePicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  const nintendo = Object.entries(CONSOLES).filter(([, v]) => v.manufacturer === 'Nintendo');
  const sony     = Object.entries(CONSOLES).filter(([, v]) => v.manufacturer === 'Sony');

  const renderGroup = (label: string, entries: [string, ConsoleInfo][], color: string) => (
    <div key={label}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${color}`}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, info]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all duration-150
              ${selected === key
                ? 'bg-primary-600 border-primary-500 text-white shadow-md shadow-primary-900/40'
                : 'bg-surface-800/60 border-surface-600/50 text-surface-300 hover:border-surface-500 hover:text-surface-100'
              }`}
          >
            {info.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {renderGroup('Nintendo', nintendo, 'text-red-400')}
      {renderGroup('Sony', sony, 'text-blue-400')}
    </div>
  );
}

// ─── Region filter ────────────────────────────────────────────────────────────

function RegionFilter({
  regions,
  onAdd,
  onRemove,
}: {
  regions: string[];
  onAdd: (r: string) => void;
  onRemove: (r: string) => void;
}) {
  const [custom, setCustom] = useState('');

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !regions.includes(trimmed)) onAdd(trimmed);
    setCustom('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {COMMON_REGIONS.map(r => {
          const active = regions.includes(r);
          return (
            <button
              key={r}
              onClick={() => (active ? onRemove(r) : onAdd(r))}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150
                ${active
                  ? 'bg-primary-600/30 border-primary-500 text-primary-200'
                  : 'bg-surface-800/40 border-surface-600/50 text-surface-400 hover:border-surface-500 hover:text-surface-200'
                }`}
            >
              {r}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Región personalizada..."
          className="bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400 h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="border-surface-600 text-surface-300 hover:bg-surface-700 shrink-0"
        >
          Añadir
        </Button>
      </div>

      {regions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-surface-500">Activos:</span>
          {regions.map(r => (
            <Badge
              key={r}
              className="bg-primary-600/20 text-primary-300 border-primary-600/40 pr-1 gap-1"
            >
              {r}
              <button
                onClick={() => onRemove(r)}
                className="hover:text-white transition-colors ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Download results ─────────────────────────────────────────────────────────

function DownloadResults({ result }: { result: BulkDownloadResult }) {
  const [showFiles, setShowFiles] = useState(false);

  const statusIcon = {
    downloaded: <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />,
    skipped:    <SkipForward  className="h-3.5 w-3.5 text-yellow-400 shrink-0" />,
    failed:     <XCircle      className="h-3.5 w-3.5 text-red-400 shrink-0" />,
  };

  const statusColor = {
    downloaded: 'text-green-300',
    skipped:    'text-yellow-300',
    failed:     'text-red-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',        value: result.totalMatched, color: 'text-surface-200' },
          { label: 'Descargados',  value: result.downloaded,   color: 'text-green-400' },
          { label: 'Omitidos',     value: result.skipped,      color: 'text-yellow-400' },
          { label: 'Fallidos',     value: result.failed,       color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-surface-800/60 rounded-lg border border-surface-700/50 p-3 text-center"
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-surface-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Downloaded size */}
      {result.downloaded > 0 && (
        <div className="flex items-center gap-2 text-sm text-surface-300">
          <HardDrive className="h-4 w-4 text-surface-400" />
          <span>
            Espacio usado: <span className="font-semibold text-surface-100">{result.totalDownloadedSize}</span>
          </span>
        </div>
      )}

      {/* File list toggle */}
      <button
        onClick={() => setShowFiles(v => !v)}
        className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors self-start"
      >
        {showFiles ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showFiles ? 'Ocultar' : 'Ver'} detalle de archivos
      </button>

      {showFiles && (
        <div className="rounded-lg border border-surface-700/50 divide-y divide-surface-700/30 max-h-72 overflow-y-auto">
          {result.files.map(f => (
            <div key={f.filename} className="flex items-center gap-2 px-3 py-2">
              {statusIcon[f.status]}
              <span className={`flex-1 text-xs truncate ${statusColor[f.status]}`}>{f.filename}</span>
              {f.size && <span className="text-xs text-surface-500 shrink-0">{f.size}</span>}
              {f.error && (
                <span className="text-xs text-red-500 truncate max-w-[120px]" title={f.error}>
                  {f.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MyrientDownloader() {
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [concurrency, setConcurrency] = useState('2');

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [downloading, setDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<BulkDownloadResult | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleConsoleSelect = (key: string) => {
    setSelectedConsole(key);
    setCatalog(null);
    setCatalogError(null);
    setSelected(new Set());
    setDownloadResult(null);
    setDownloadError(null);
  };

  const addRegion    = (r: string) => setRegions(prev => prev.includes(r) ? prev : [...prev, r]);
  const removeRegion = (r: string) => setRegions(prev => prev.filter(x => x !== r));

  const loadCatalog = async () => {
    if (!selectedConsole) return;
    setLoadingCatalog(true);
    setCatalogError(null);
    setCatalog(null);
    setSelected(new Set());
    setDownloadResult(null);
    setDownloadError(null);
    try {
      const res = await ScrapeService.getCatalog(selectedConsole, regions);
      if (res.success && res.data) {
        setCatalog(res.data);
      } else {
        setCatalogError(res.error ?? res.message ?? 'Error al cargar el catálogo.');
      }
    } catch {
      setCatalogError('No se pudo conectar con el servidor.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const toggleGame = useCallback((name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  const selectAll = useCallback((names: string[]) => {
    setSelected(new Set(names));
  }, []);

  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleDownload = async () => {
    if (!selectedConsole || selected.size === 0 || !catalog) return;
    const gameMap = new Map<string, GameFileEntry>(catalog.files.map(f => [f.name, f]));
    const games: GameFileEntry[] = [...selected]
      .map(name => gameMap.get(name))
      .filter((f): f is GameFileEntry => !!f);

    setDownloading(true);
    setDownloadError(null);
    setDownloadResult(null);
    try {
      const res = await ScrapeService.downloadSelected({
        console: selectedConsole,
        games,
        concurrency: Number(concurrency),
      });
      if (res.success && res.data) {
        setDownloadResult(res.data);
        setSelected(new Set());
      } else {
        setDownloadError(res.error ?? res.message ?? 'Error al iniciar la descarga.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setDownloadError(`Error de descarga: ${msg}`);
    } finally {
      setDownloading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-40">
      <div className="container mx-auto px-4 py-10 max-w-4xl flex flex-col gap-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-surface-50">
            Descargador{' '}
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Myrient
            </span>
          </h1>
          <p className="text-surface-400 mt-1 text-sm">
            Explora el catálogo, selecciona los juegos que quieres y descárgalos directamente al servidor.
          </p>
        </motion.div>

        {/* Console picker */}
        <Card className="bg-surface-800/40 border-surface-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-surface-200">1. Selecciona una consola</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsolePicker selected={selectedConsole} onSelect={handleConsoleSelect} />
          </CardContent>
        </Card>

        {/* Region filter + load */}
        <AnimatePresence>
          {selectedConsole && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card className="bg-surface-800/40 border-surface-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-surface-200">
                    2. Filtra por región{' '}
                    <span className="text-surface-500 font-normal text-sm">(opcional)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <RegionFilter regions={regions} onAdd={addRegion} onRemove={removeRegion} />

                  <div className="flex items-center gap-3 pt-1 border-t border-surface-700/40">
                    <div className="text-sm text-surface-400">
                      Consola:{' '}
                      <span className="text-primary-300 font-medium">
                        {CONSOLES[selectedConsole]?.label}
                      </span>
                    </div>
                    {regions.length > 0 && (
                      <div className="text-sm text-surface-400">
                        · Regiones:{' '}
                        <span className="text-surface-200">{regions.join(', ')}</span>
                      </div>
                    )}
                    <Button
                      onClick={loadCatalog}
                      disabled={loadingCatalog}
                      className="ml-auto bg-primary-600 hover:bg-primary-500 text-white"
                    >
                      {loadingCatalog ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {catalog ? 'Recargar catálogo' : 'Cargar catálogo'}
                    </Button>
                  </div>

                  {catalogError && (
                    <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">
                      {catalogError}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Catalog */}
        <AnimatePresence>
          {catalog && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="bg-surface-800/40 border-surface-700/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base text-surface-200">
                      3. Selecciona los juegos
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-surface-400">
                      <span>{catalog.count} juegos</span>
                      <span>·</span>
                      <span>{catalog.totalSize}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <GameCatalogTable
                    files={catalog.files}
                    selected={selected}
                    onToggle={toggleGame}
                    onSelectAll={selectAll}
                    onClearAll={clearAll}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Download results */}
        <AnimatePresence>
          {downloadResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="bg-surface-800/40 border-surface-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-surface-200">Resultado de descarga</CardTitle>
                </CardHeader>
                <CardContent>
                  <DownloadResults result={downloadResult} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Sticky download bar */}
      <AnimatePresence>
        {selected.size > 0 && catalog && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface-900/95 backdrop-blur border-t border-surface-700/60 shadow-2xl"
          >
            <div className="container mx-auto px-4 py-3 max-w-4xl flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-100">
                  {selected.size} juego{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-surface-400">
                  {CONSOLES[selectedConsole!]?.label}
                  {regions.length > 0 && ` · ${regions.join(', ')}`}
                </p>
              </div>

              {/* Concurrency */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-surface-400">Concurrencia:</span>
                <Select value={concurrency} onValueChange={setConcurrency}>
                  <SelectTrigger className="h-8 w-16 bg-surface-800 border-surface-600 text-surface-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-800 border-surface-700">
                    {['1', '2', '3', '4', '5'].map(n => (
                      <SelectItem key={n} value={n} className="text-surface-200">
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {downloadError && (
                <p className="text-xs text-red-400 max-w-xs truncate">{downloadError}</p>
              )}

              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-primary-600 hover:bg-primary-500 text-white shrink-0"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {downloading ? 'Descargando...' : 'Descargar selección'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
