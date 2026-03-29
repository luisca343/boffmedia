'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
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
  CheckCircle2,
  XCircle,
  SkipForward,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import {
  ScrapeService,
  CatalogResult,
  FileDownloadEntry,
  FileDownloadStatus,
  GameFileEntry,
  SseDoneEvent,
} from '@/services/api/boffmedia/scrapeService';
import GameCatalogTable from './GameCatalogTable';
import { FloatingSection } from '@/app/(boffmedia)/_components/layout/FloatingSection';
import { CONSOLES } from '../../biblioteca/_components/consoles';
import { ConsolePicker } from '../../biblioteca/_components/ConsolePicker';
import { RegionFilter } from '../../biblioteca/_components/RegionFilter';

// ─── Per-file status maps ─────────────────────────────────────────────────────

const STATUS_ICON: Record<FileDownloadStatus, React.ReactNode> = {
  pending:     <Clock        className="h-3.5 w-3.5 text-surface-500 shrink-0" />,
  downloading: <Loader2      className="h-3.5 w-3.5 text-blue-400 shrink-0 animate-spin" />,
  downloaded:  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />,
  skipped:     <SkipForward  className="h-3.5 w-3.5 text-yellow-400 shrink-0" />,
  failed:      <XCircle      className="h-3.5 w-3.5 text-red-400 shrink-0" />,
};

const STATUS_COLOR: Record<FileDownloadStatus, string> = {
  pending:     'text-surface-500',
  downloading: 'text-blue-300',
  downloaded:  'text-green-300',
  skipped:     'text-yellow-300',
  failed:      'text-red-300',
};

const STATUS_BG: Record<FileDownloadStatus, string> = {
  pending:     '',
  downloading: 'bg-blue-900/10',
  downloaded:  'bg-green-900/10',
  skipped:     'bg-yellow-900/10',
  failed:      'bg-red-900/10',
};

// ─── Live progress panel ──────────────────────────────────────────────────────

interface ProgressState {
  files: FileDownloadEntry[];
  completed: number;
  total: number;
  summary: SseDoneEvent | null;
}

function DownloadProgressPanel({ progress }: { progress: ProgressState }) {
  const [showFiles, setShowFiles] = useState(true);
  const { files, completed, total, summary } = progress;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const counts = files.reduce<Record<FileDownloadStatus, number>>(
    (acc, f) => { acc[f.status]++; return acc; },
    { pending: 0, downloading: 0, downloaded: 0, skipped: 0, failed: 0 },
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-surface-300 font-medium">
            {summary ? 'Descarga completada' : `Descargando… ${completed} / ${total}`}
          </span>
          <span className="text-surface-400">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-700/60 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${summary ? 'bg-green-500' : 'bg-primary-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {counts.downloaded  > 0 && <span className="px-2 py-1 rounded-full bg-green-900/30 text-green-300 border border-green-800/40">{counts.downloaded} descargados</span>}
        {counts.skipped     > 0 && <span className="px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-300 border border-yellow-800/40">{counts.skipped} omitidos</span>}
        {counts.failed      > 0 && <span className="px-2 py-1 rounded-full bg-red-900/30 text-red-300 border border-red-800/40">{counts.failed} fallidos</span>}
        {counts.downloading > 0 && <span className="px-2 py-1 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/40">{counts.downloading} en progreso</span>}
        {summary && <span className="px-2 py-1 rounded-full bg-surface-700/40 text-surface-300 border border-surface-600/40 flex items-center gap-1"><HardDrive className="h-3 w-3" />{summary.totalDownloadedSize}</span>}
      </div>

      <button
        onClick={() => setShowFiles(v => !v)}
        className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors self-start"
      >
        {showFiles ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showFiles ? 'Ocultar' : 'Ver'} archivos ({files.length})
      </button>

      {showFiles && (
        <div className="rounded-lg border border-surface-700/50 divide-y divide-surface-700/30 max-h-80 overflow-y-auto">
          {files.map(f => (
            <motion.div
              key={f.filename}
              layout
              className={`flex items-center gap-2 px-3 py-2 transition-colors duration-300 ${STATUS_BG[f.status]}`}
            >
              {STATUS_ICON[f.status]}
              <span className={`flex-1 text-xs truncate ${STATUS_COLOR[f.status]}`} title={f.filename}>
                {f.filename}
              </span>
              {f.size && <span className="text-xs text-surface-500 shrink-0">{f.size}</span>}
              {f.error && <span className="text-xs text-red-500 truncate max-w-[140px]" title={f.error}>{f.error}</span>}
            </motion.div>
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

  const [downloadedSet, setDownloadedSet] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const addRegion    = (r: string) => setRegions(prev => prev.includes(r) ? prev : [...prev, r]);
  const removeRegion = (r: string) => setRegions(prev => prev.filter(x => x !== r));

  const handleConsoleSelect = (key: string) => {
    setSelectedConsole(key);
    setCatalog(null);
    setCatalogError(null);
    setSelected(new Set());
    setDownloadedSet(new Set());
    setProgress(null);
    setDownloadError(null);
  };

  const refreshLocalGames = async (consoleKey: string, regionList: string[]) => {
    try {
      const res = await ScrapeService.getLocalGames(consoleKey, regionList);
      if (res.success && res.data) setDownloadedSet(new Set(res.data.files.map(f => f.filename)));
    } catch { /* non-critical */ }
  };

  const loadCatalog = async () => {
    if (!selectedConsole) return;
    setLoadingCatalog(true);
    setCatalogError(null);
    setCatalog(null);
    setSelected(new Set());
    setProgress(null);
    setDownloadError(null);
    try {
      const [catalogRes] = await Promise.all([
        ScrapeService.getCatalog(selectedConsole, regions),
        refreshLocalGames(selectedConsole, regions),
      ]);
      if (catalogRes.success && catalogRes.data) setCatalog(catalogRes.data);
      else setCatalogError(catalogRes.error ?? catalogRes.message ?? 'Error al cargar el catálogo.');
    } catch {
      setCatalogError('No se pudo conectar con el servidor.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const toggleGame  = useCallback((name: string) => setSelected(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; }), []);
  const selectAll   = useCallback((names: string[]) => setSelected(new Set(names)), []);
  const clearAll    = useCallback(() => setSelected(new Set()), []);

  const handleDownload = async () => {
    if (!selectedConsole || selected.size === 0 || !catalog) return;

    const gameMap = new Map<string, GameFileEntry>(catalog.files.map(f => [f.name, f]));
    const games: GameFileEntry[] = [...selected].map(n => gameMap.get(n)).filter((f): f is GameFileEntry => !!f);

    const initialFiles: FileDownloadEntry[] = games.map(g => ({
      filename: decodeURIComponent(g.link.split('/').pop() ?? g.name),
      status: 'pending',
    }));
    setProgress({ files: initialFiles, completed: 0, total: games.length, summary: null });
    setDownloading(true);
    setDownloadError(null);
    setSelected(new Set());

    try {
      await ScrapeService.streamDownloadSelected(
        { console: selectedConsole, games, concurrency: Number(concurrency) },
        (event) => {
          if (event.type === 'progress') {
            setProgress(prev => {
              if (!prev) return prev;
              const files = [...prev.files];
              const idx = files.findIndex(f => f.filename === event.filename);
              if (idx !== -1) files[idx] = { filename: event.filename, status: event.status, size: event.size, sizeBytes: event.sizeBytes, error: event.error };
              return { ...prev, files, completed: event.index };
            });
          } else if (event.type === 'done') {
            setProgress(prev => prev ? { ...prev, summary: event, completed: prev.total } : prev);
          }
        },
      );
    } catch (err) {
      setDownloadError(`Error de descarga: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloading(false);
      if (selectedConsole) await refreshLocalGames(selectedConsole, regions);
    }
  };

  return (
    <FloatingSection className="min-h-screen pb-40">
      <div className="container mx-auto px-4 py-10 max-w-4xl flex flex-col gap-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-surface-50">
            Descargador{' '}
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Myrient</span>
          </h1>
          <p className="text-surface-400 mt-1 text-sm">
            Explora el catálogo, selecciona los juegos que quieres y descárgalos directamente al servidor.
          </p>
        </motion.div>

        {/* Filters card */}
        <Card className="bg-surface-800/40 border-surface-700/50">
          <CardContent className="pt-5 flex flex-col gap-5">

            {/* Console picker */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Consola</span>
                {selectedConsole
                  ? <Badge className="bg-primary-600/20 text-primary-300 border-primary-600/40 text-xs">
                      {CONSOLES[selectedConsole]?.shortLabel ?? selectedConsole}
                    </Badge>
                  : <span className="text-xs text-surface-500">selecciona una para cargar el catálogo</span>
                }
              </div>
              <ConsolePicker selected={selectedConsole} onSelect={handleConsoleSelect} compact />
            </div>

            {/* Region filter + load button */}
            <div className="flex flex-col gap-3 pt-1 border-t border-surface-700/40">
              <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                Región <span className="normal-case font-normal text-surface-500">(opcional)</span>
              </span>
              <RegionFilter regions={regions} onAdd={addRegion} onRemove={removeRegion} />
              <div className="flex items-center gap-3 pt-1 border-t border-surface-700/40">
                {selectedConsole && (
                  <div className="text-sm text-surface-400 truncate">
                    <span className="text-primary-300 font-medium">{CONSOLES[selectedConsole]?.label}</span>
                    {regions.length > 0 && <span className="text-surface-500"> · {regions.join(', ')}</span>}
                  </div>
                )}
                <Button
                  onClick={loadCatalog}
                  disabled={!selectedConsole || loadingCatalog}
                  className="ml-auto bg-primary-600 hover:bg-primary-500 text-white shrink-0"
                >
                  {loadingCatalog
                    ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    : <RefreshCw className="h-4 w-4 mr-2" />
                  }
                  {catalog ? 'Recargar catálogo' : 'Cargar catálogo'}
                </Button>
              </div>
              {catalogError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{catalogError}</p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Catalog table */}
        <AnimatePresence>
          {catalog && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="bg-surface-800/40 border-surface-700/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base text-surface-200">Catálogo</CardTitle>
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
                    downloadedSet={downloadedSet}
                    onToggle={toggleGame}
                    onSelectAll={selectAll}
                    onClearAll={clearAll}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress panel */}
        <AnimatePresence>
          {progress && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="bg-surface-800/40 border-surface-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-surface-200">Progreso de descarga</CardTitle>
                </CardHeader>
                <CardContent>
                  <DownloadProgressPanel progress={progress} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Sticky download bar */}
      <AnimatePresence>
        {selected.size > 0 && catalog && !downloading && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
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
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-surface-400">Concurrencia:</span>
                <Select value={concurrency} onValueChange={setConcurrency}>
                  <SelectTrigger className="h-8 w-16 bg-surface-800 border-surface-600 text-surface-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-800 border-surface-700">
                    {['1', '2', '3', '4', '5'].map(n => (
                      <SelectItem key={n} value={n} className="text-surface-200">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {downloadError && <p className="text-xs text-red-400 max-w-xs truncate">{downloadError}</p>}
              <Button onClick={handleDownload} disabled={downloading} className="bg-primary-600 hover:bg-primary-500 text-white shrink-0">
                <Download className="h-4 w-4 mr-2" />
                Descargar selección
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FloatingSection>
  );
}
