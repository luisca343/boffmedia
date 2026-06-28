'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import { Input } from '@/components/ui/primitives/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/primitives/select';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import {
  Download, Loader2, Search, CheckCircle2, XCircle, SkipForward,
  HardDrive, ChevronDown, ChevronUp, Clock, CheckSquare, Square,
} from 'lucide-react';
import {
  ScrapeService,
  CatalogResult, CatalogSearchConsoleResult, CatalogSearchResult,
  FileDownloadEntry, FileDownloadStatus, GameFileEntry, SseDoneEvent,
} from '@/services/api/boffmedia/scrapeService';
import GameCatalogTable from './GameCatalogTable';
import { FloatingSection } from '@/app/(boffmedia)/_components/layout/FloatingSection';
import { CONSOLES, MANUFACTURER_COLORS } from '../../_components/consoles';
import { ConsolePicker } from '../../_components/ConsolePicker';
import { RegionFilter } from '../../_components/RegionFilter';

// ─── Per-file status maps ─────────────────────────────────────────────────────

const STATUS_ICON: Record<FileDownloadStatus, React.ReactNode> = {
  pending:     <Clock        className="h-3.5 w-3.5 text-ink-muted shrink-0" />,
  downloading: <Loader2      className="h-3.5 w-3.5 text-blue-400 shrink-0 animate-spin" />,
  downloaded:  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />,
  skipped:     <SkipForward  className="h-3.5 w-3.5 text-yellow-400 shrink-0" />,
  failed:      <XCircle      className="h-3.5 w-3.5 text-red-400 shrink-0" />,
};
const STATUS_COLOR: Record<FileDownloadStatus, string> = {
  pending: 'text-ink-muted', downloading: 'text-blue-300',
  downloaded: 'text-green-300', skipped: 'text-yellow-300', failed: 'text-red-300',
};
const STATUS_BG: Record<FileDownloadStatus, string> = {
  pending: '', downloading: 'bg-blue-900/10', downloaded: 'bg-green-900/10',
  skipped: 'bg-yellow-900/10', failed: 'bg-red-900/10',
};

// ─── Progress panel ───────────────────────────────────────────────────────────

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
          <span className="text-ink font-medium">
            {summary ? 'Descarga completada' : `Descargando… ${completed} / ${total}`}
          </span>
          <span className="text-ink-muted">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-layer-3/60 overflow-hidden">
          <motion.div className={`h-full rounded-full ${summary ? 'bg-green-500' : 'bg-primary'}`}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ease: 'easeOut', duration: 0.3 }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {counts.downloaded  > 0 && <span className="px-2 py-1 rounded-full bg-green-900/30 text-green-300 border border-green-800/40">{counts.downloaded} descargados</span>}
        {counts.skipped     > 0 && <span className="px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-300 border border-yellow-800/40">{counts.skipped} omitidos</span>}
        {counts.failed      > 0 && <span className="px-2 py-1 rounded-full bg-red-900/30 text-red-300 border border-red-800/40">{counts.failed} fallidos</span>}
        {counts.downloading > 0 && <span className="px-2 py-1 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/40">{counts.downloading} en progreso</span>}
        {summary && <span className="px-2 py-1 rounded-full bg-layer-3/40 text-ink border border-edge/40 flex items-center gap-1"><HardDrive className="h-3 w-3" />{summary.totalDownloadedSize}</span>}
      </div>
      <button onClick={() => setShowFiles(v => !v)}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors self-start">
        {showFiles ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showFiles ? 'Ocultar' : 'Ver'} archivos ({files.length})
      </button>
      {showFiles && (
        <div className="rounded-lg border border-edge/50 divide-y divide-edge/30 max-h-80 overflow-y-auto">
          {files.map(f => (
            <motion.div key={f.filename} layout
              className={`flex items-center gap-2 px-3 py-2 transition-colors duration-300 ${STATUS_BG[f.status]}`}>
              {STATUS_ICON[f.status]}
              <span className={`flex-1 text-xs truncate ${STATUS_COLOR[f.status]}`} title={f.filename}>{f.filename}</span>
              {f.size && <span className="text-xs text-ink-muted shrink-0">{f.size}</span>}
              {f.error && <span className="text-xs text-red-500 truncate max-w-[140px]" title={f.error}>{f.error}</span>}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Multi-console console group ──────────────────────────────────────────────

interface CatalogGroupProps {
  result: CatalogSearchConsoleResult;
  groupSelected: Set<string>;
  downloadedSet: Set<string>;
  onToggle: (name: string) => void;
  onToggleAll: () => void;
}

function CatalogConsoleGroup({ result, groupSelected, downloadedSet, onToggle, onToggleAll }: CatalogGroupProps) {
  const localFilename = (file: GameFileEntry) =>
    decodeURIComponent(file.link.split('/').pop() ?? file.name);
  const [expanded, setExpanded] = useState(true);
  const info = CONSOLES[result.consoleKey];
  const color = info ? MANUFACTURER_COLORS[info.manufacturer] : 'text-ink-muted';
  const allSelected = result.files.length > 0 && result.files.every(f => groupSelected.has(f.name));

  return (
    <div className="rounded-lg border border-edge/50 overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-layer-2/60 hover:bg-layer-2/80 transition-colors text-left">
        <span className={`text-sm font-semibold ${color} truncate flex-1`}>{result.consoleLabel}</span>
        <Badge className="bg-layer-3/40 text-ink border-edge/40 shrink-0">
          {result.count} juego{result.count !== 1 ? 's' : ''}
        </Badge>
        {groupSelected.size > 0 && (
          <Badge className="bg-primary-active/20 text-primary-hover border-primary-active/40 shrink-0">
            {groupSelected.size} sel.
          </Badge>
        )}
        {expanded ? <ChevronUp className="h-4 w-4 text-ink-muted shrink-0" /> : <ChevronDown className="h-4 w-4 text-ink-muted shrink-0" />}
      </button>

      {/* File list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {/* Select-all row */}
            <div className="flex items-center gap-3 px-4 py-2 bg-layer-2/40 border-b border-edge/40">
              <Checkbox checked={allSelected} onCheckedChange={onToggleAll}
                className="border-edge data-[state=checked]:bg-primary-active data-[state=checked]:border-primary-active" />
              <button onClick={onToggleAll} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors">
                {allSelected
                  ? <><Square className="h-3 w-3" /> Deseleccionar todos</>
                  : <><CheckSquare className="h-3 w-3" /> Seleccionar todos ({result.files.length})</>
                }
              </button>
            </div>
            <div className="divide-y divide-edge/30">
              {result.files.map(file => {
                const isSelected   = groupSelected.has(file.name);
                const isDownloaded = downloadedSet.has(localFilename(file));
                return (
                  <div key={file.name} onClick={() => onToggle(file.name)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100
                      ${isSelected ? 'bg-primary-soft/20 hover:bg-primary-soft/30' : isDownloaded ? 'bg-green-900/10 hover:bg-green-900/20' : 'hover:bg-layer-3/20'}`}>
                    <Checkbox checked={isSelected} onCheckedChange={() => onToggle(file.name)}
                      onClick={e => e.stopPropagation()}
                      className="border-edge data-[state=checked]:bg-primary-active data-[state=checked]:border-primary-active shrink-0" />
                    <span className={`flex-1 text-sm truncate ${isDownloaded ? 'text-green-300' : 'text-ink'}`} title={file.name}>{file.name}</span>
                    {isDownloaded && <span title="Ya descargado"><HardDrive className="h-3.5 w-3.5 text-green-500/70 shrink-0" /></span>}
                    <span className="text-xs text-ink-muted w-24 text-right shrink-0">{file.size}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MyrientDownloader() {
  const [query, setQuery] = useState('');
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [concurrency, setConcurrency] = useState('2');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single-console mode
  const [singleCatalog, setSingleCatalog] = useState<CatalogResult | null>(null);
  const [downloadedSet, setDownloadedSet] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Multi-console mode
  const [multiCatalog, setMultiCatalog] = useState<CatalogSearchResult | null>(null);
  const [multiSelected, setMultiSelected] = useState<Map<string, Set<string>>>(new Map());
  const [multiDownloadedSet, setMultiDownloadedSet] = useState<Map<string, Set<string>>>(new Map());

  // Download state (shared)
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const totalMultiSelected = [...multiSelected.values()].reduce((s, set) => s + set.size, 0);
  const multiConsoleCount  = [...multiSelected.values()].filter(s => s.size > 0).length;

  const addRegion    = (r: string) => setRegions(prev => prev.includes(r) ? prev : [...prev, r]);
  const removeRegion = (r: string) => setRegions(prev => prev.filter(x => x !== r));

  const handleConsoleSelect = (key: string) => {
    setSelectedConsole(prev => (prev === key ? null : key));
    setSingleCatalog(null);
    setMultiCatalog(null);
    setSelected(new Set());
    setMultiSelected(new Map());
    setDownloadedSet(new Set());
    setMultiDownloadedSet(new Map());
    setProgress(null);
    setError(null);
  };

  const toggleMultiGame = useCallback((consoleKey: string, name: string) => {
    setMultiSelected(prev => {
      const next = new Map(prev);
      const set = new Set(next.get(consoleKey) ?? []);
      set.has(name) ? set.delete(name) : set.add(name);
      next.set(consoleKey, set);
      return next;
    });
  }, []);

  const toggleMultiAll = useCallback((consoleKey: string, files: GameFileEntry[]) => {
    setMultiSelected(prev => {
      const next = new Map(prev);
      const current = next.get(consoleKey) ?? new Set<string>();
      const allSel = files.every(f => current.has(f.name));
      next.set(consoleKey, allSel ? new Set() : new Set(files.map(f => f.name)));
      return next;
    });
  }, []);

  const refreshLocalGames = async (consoleKey: string) => {
    try {
      const res = await ScrapeService.getLocalGames(consoleKey, regions);
      if (res.success && res.data) setDownloadedSet(new Set(res.data.files.map(f => f.filename)));
    } catch { /* non-critical */ }
  };

  const refreshMultiDownloaded = async (consoleKeys: string[]) => {
    const entries = await Promise.all(
      consoleKeys.map(async (key) => {
        try {
          const res = await ScrapeService.getLocalGames(key, regions);
          if (res.success && res.data)
            return [key, new Set(res.data.files.map(f => f.filename))] as const;
        } catch { /* non-critical */ }
        return [key, new Set<string>()] as const;
      }),
    );
    setMultiDownloadedSet(prev => {
      const next = new Map(prev);
      for (const [key, set] of entries) next.set(key, set);
      return next;
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSingleCatalog(null);
    setMultiCatalog(null);
    setSelected(new Set());
    setMultiSelected(new Map());
    setMultiDownloadedSet(new Map());
    setProgress(null);

    try {
      if (selectedConsole) {
        const [catalogRes] = await Promise.all([
          ScrapeService.getCatalog(selectedConsole, regions),
          refreshLocalGames(selectedConsole),
        ]);
        if (catalogRes.success && catalogRes.data) setSingleCatalog(catalogRes.data);
        else setError(catalogRes.error ?? catalogRes.message ?? 'Error al cargar el catálogo.');
      } else {
        const res = await ScrapeService.searchCatalog(query.trim(), regions);
        if (res.success && res.data) {
          await refreshMultiDownloaded(res.data.consoles.map(c => c.consoleKey));
          setMultiCatalog(res.data);
        } else {
          setError(res.error ?? res.message ?? 'Error al buscar en los catálogos.');
        }
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGame  = useCallback((name: string) => setSelected(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; }), []);
  const selectAll   = useCallback((names: string[]) => setSelected(new Set(names)), []);
  const clearAll    = useCallback(() => setSelected(new Set()), []);

  // Unified download trigger — used by both single and multi-console modes
  const triggerDownload = async (consoleKey: string, games: GameFileEntry[]) => {
    const initialFiles: FileDownloadEntry[] = games.map(g => ({
      filename: decodeURIComponent(g.link.split('/').pop() ?? g.name),
      status: 'pending',
    }));
    setProgress({ files: initialFiles, completed: 0, total: games.length, summary: null });
    setDownloading(true);
    setDownloadError(null);
    if (consoleKey === selectedConsole) setSelected(new Set());

    try {
      await ScrapeService.streamDownloadSelected(
        { console: consoleKey, games, concurrency: Number(concurrency) },
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
      if (consoleKey === selectedConsole) await refreshLocalGames(consoleKey);
    }
  };

  const triggerMultiDownload = async () => {
    if (!multiCatalog) return;
    const plan: { consoleKey: string; games: GameFileEntry[] }[] = [];
    const allInitial: FileDownloadEntry[] = [];

    for (const [consoleKey, names] of multiSelected) {
      if (!names.size) continue;
      const group = multiCatalog.consoles.find(c => c.consoleKey === consoleKey);
      if (!group) continue;
      const games = group.files.filter(f => names.has(f.name));
      if (!games.length) continue;
      plan.push({ consoleKey, games });
      for (const g of games) {
        allInitial.push({ filename: decodeURIComponent(g.link.split('/').pop() ?? g.name), status: 'pending' });
      }
    }
    if (!allInitial.length) return;

    setProgress({ files: allInitial, completed: 0, total: allInitial.length, summary: null });
    setDownloading(true);
    setDownloadError(null);
    setMultiSelected(new Map());

    let globalCompleted = 0;
    try {
      for (const { consoleKey, games } of plan) {
        await ScrapeService.streamDownloadSelected(
          { console: consoleKey, games, concurrency: Number(concurrency) },
          (event) => {
            if (event.type === 'progress') {
              setProgress(prev => {
                if (!prev) return prev;
                const files = [...prev.files];
                const idx = files.findIndex(f => f.filename === event.filename && f.status === 'pending');
                if (idx !== -1) files[idx] = { filename: event.filename, status: event.status, size: event.size, sizeBytes: event.sizeBytes, error: event.error };
                return { ...prev, files, completed: globalCompleted + event.index };
              });
            } else if (event.type === 'done') {
              globalCompleted += games.length;
            }
          },
        );
      }
      setProgress(prev => prev
        ? { ...prev, completed: prev.total, summary: { type: 'done', console: '', consoleLabel: '', downloaded: 0, skipped: 0, failed: 0, totalDownloadedSize: '', totalDownloadedSizeBytes: 0 } }
        : prev,
      );
    } catch (err) {
      setDownloadError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloading(false);
      if (multiCatalog) refreshMultiDownloaded(plan.map(p => p.consoleKey));
    }
  };

  const handleSingleDownload = () => {
    if (!selectedConsole || selected.size === 0 || !singleCatalog) return;
    const gameMap = new Map(singleCatalog.files.map(f => [f.name, f]));
    const games = [...selected].map(n => gameMap.get(n)).filter((f): f is GameFileEntry => !!f);
    triggerDownload(selectedConsole, games);
  };

  const isSearchDisabled = loading || (!selectedConsole && !query.trim());

  return (
    <FloatingSection className="min-h-screen pb-40">
      <div className="container mx-auto px-4 py-10 max-w-4xl flex flex-col gap-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-ink">
            Descargador{' '}
            <span className="bg-gradient-to-r from-primary-hover to-primary-active bg-clip-text text-transparent">Myrient</span>
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            Explora el catálogo, selecciona los juegos que quieres y descárgalos directamente al servidor.
          </p>
        </motion.div>

        {/* Filters card */}
        <Card className="bg-layer-2/40 border-edge/50">
          <CardContent className="pt-5 flex flex-col gap-5">

            {/* Query + button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isSearchDisabled && handleSearch()}
                  placeholder={selectedConsole ? 'Filtrar en el catálogo…' : '"Pokémon", "Mario"… o vacío para ver todo de la consola'}
                  className="pl-9 bg-layer-2/60 border-edge text-ink placeholder-ink-dim"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearchDisabled}
                className="bg-primary-active hover:bg-primary text-white shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">{selectedConsole ? 'Cargar' : 'Buscar en todas'}</span>
              </Button>
            </div>

            {/* Console picker */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">Consola</span>
                {selectedConsole
                  ? <Badge className="bg-primary-active/20 text-primary-hover border-primary-active/40 text-xs">
                      {CONSOLES[selectedConsole]?.shortLabel ?? selectedConsole}
                    </Badge>
                  : <span className="text-xs text-ink-muted">ninguna seleccionada = busca en todas</span>
                }
              </div>
              <ConsolePicker selected={selectedConsole} onSelect={handleConsoleSelect} compact />
            </div>

            {/* Region filter */}
            <div className="flex flex-col gap-2 pt-1 border-t border-edge/40">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                Región <span className="normal-case font-normal text-ink-muted">(opcional)</span>
              </span>
              <RegionFilter regions={regions} onAdd={addRegion} onRemove={removeRegion} />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Single-console catalog */}
        <AnimatePresence>
          {singleCatalog && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="bg-layer-2/40 border-edge/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base text-ink">Catálogo</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-ink-muted">
                      <span>{singleCatalog.count} juegos</span>
                      <span>·</span>
                      <span>{singleCatalog.totalSize}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <GameCatalogTable
                    files={singleCatalog.files}
                    selected={selected}
                    downloadedSet={downloadedSet}
                    onToggle={toggleGame}
                    onSelectAll={selectAll}
                    onClearAll={clearAll}
                    initialSearch={query}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multi-console results */}
        <AnimatePresence>
          {multiCatalog && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-ink">
                  {multiCatalog.query
                    ? <>Resultados para <span className="text-primary-hover font-medium">&ldquo;{multiCatalog.query}&rdquo;</span></>
                    : <span>Todos los catálogos</span>
                  }
                </p>
                <div className="flex items-center gap-3 text-sm text-ink-muted">
                  <span>{multiCatalog.totalCount} juego{multiCatalog.totalCount !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{multiCatalog.consoles.length} consola{multiCatalog.consoles.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {multiCatalog.totalCount === 0 ? (
                <p className="text-ink-muted text-sm py-8 text-center">
                  No se encontraron juegos{multiCatalog.query ? ` para "${multiCatalog.query}"` : ''}
                  {regions.length > 0 ? ' con los filtros de región seleccionados' : ''}.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {multiCatalog.consoles.map(c => (
                    <CatalogConsoleGroup
                      key={c.consoleKey}
                      result={c}
                      groupSelected={multiSelected.get(c.consoleKey) ?? new Set()}
                      downloadedSet={multiDownloadedSet.get(c.consoleKey) ?? new Set()}
                      onToggle={(name) => toggleMultiGame(c.consoleKey, name)}
                      onToggleAll={() => toggleMultiAll(c.consoleKey, c.files)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress panel */}
        <AnimatePresence>
          {progress && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="bg-layer-2/40 border-edge/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-ink">Progreso de descarga</CardTitle>
                </CardHeader>
                <CardContent><DownloadProgressPanel progress={progress} /></CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Sticky bar — single and multi-console */}
      <AnimatePresence>
        {(selected.size > 0 && singleCatalog || totalMultiSelected > 0 && multiCatalog) && !downloading && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-layer-1/95 backdrop-blur border-t border-edge/60 shadow-2xl"
          >
            <div className="container mx-auto px-4 py-3 max-w-4xl flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                {singleCatalog ? (
                  <>
                    <p className="text-sm font-medium text-ink">
                      {selected.size} juego{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {CONSOLES[selectedConsole!]?.label}
                      {regions.length > 0 && ` · ${regions.join(', ')}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-ink">
                      {totalMultiSelected} juego{totalMultiSelected !== 1 ? 's' : ''} seleccionado{totalMultiSelected !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {multiConsoleCount} consola{multiConsoleCount !== 1 ? 's' : ''}
                      {regions.length > 0 && ` · ${regions.join(', ')}`}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-ink-muted">Concurrencia:</span>
                <Select value={concurrency} onValueChange={setConcurrency}>
                  <SelectTrigger className="h-8 w-16 bg-layer-2 border-edge text-ink text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-layer-2 border-edge">
                    {['1','2','3','4','5'].map(n => <SelectItem key={n} value={n} className="text-ink">{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {downloadError && <p className="text-xs text-red-400 max-w-xs truncate">{downloadError}</p>}
              <Button
                onClick={singleCatalog ? handleSingleDownload : triggerMultiDownload}
                disabled={downloading}
                className="bg-primary-active hover:bg-primary text-white shrink-0"
              >
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
