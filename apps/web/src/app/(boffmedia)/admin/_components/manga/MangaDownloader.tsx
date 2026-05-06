'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import { Input } from '@/components/ui/primitives/input';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import {
  BookOpen, Search, Download, Loader2, ChevronDown, ChevronUp,
  CheckSquare, Square, HardDrive, CheckCircle2, XCircle, Clock,
  X, Globe,
} from 'lucide-react';
import {
  ScrapeService,
  type BrowserConfig,
  type MangaSearchResult,
  type MangaChapter,
  type MangaDownloadSseEvent,
  type LocalMangaLibrary,
} from '@/services/api/boffmedia/scrapeService';
import { useMangaStore } from '@/stores/useMangaStore';
import MangaMetadataForm from './MangaMetadataForm';

// ─── Scraper sources panel ─────────────────────────────────────────────────────

const SCRAPER_SOURCES = [
  { name: 'NovelCool', url: 'https://es.novelcool.com', active: true, description: 'Manga y manhwa en español' },
  { name: 'PkProject', url: 'https://pkproject.net', active: true, description: 'Pokémon Adventures' },
] as const;

function ScraperSourcesPanel() {
  const [browserConfig, setBrowserConfig] = useState<BrowserConfig | null>(null);
  const [tunnelToggling, setTunnelToggling] = useState(false);

  useEffect(() => {
    ScrapeService.getBrowserConfig().then(res => {
      if (res.success && res.data) setBrowserConfig(res.data);
    });
  }, []);

  const handleTunnelToggle = async () => {
    if (!browserConfig || tunnelToggling) return;
    setTunnelToggling(true);
    try {
      const res = await ScrapeService.setBrowserTunnel(!browserConfig.tunnelEnabled);
      if (res.success && res.data) setBrowserConfig(res.data);
    } finally {
      setTunnelToggling(false);
    }
  };

  return (
    <Card className="bg-surface-800/40 border-surface-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-surface-300 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary-400" />Fuentes disponibles
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {SCRAPER_SOURCES.map(source => (
            <div key={source.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs
              border-surface-600/50 bg-surface-700/30">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${source.active ? 'bg-green-400' : 'bg-surface-500'}`} />
              <span className="font-medium text-surface-200">{source.name}</span>
              <span className="text-surface-500">{source.description}</span>
              <Badge className={`text-[10px] px-1.5 py-0 h-4 ${source.active
                ? 'bg-green-900/30 text-green-300 border-green-800/40'
                : 'bg-surface-700/40 text-surface-400 border-surface-600/40'}`}>
                {source.active ? 'Activo' : 'No disponible'}
              </Badge>
            </div>
          ))}
        </div>

        {/* Browser tunnel toggle */}
        {browserConfig && (
          <div className="flex items-center justify-between pt-1 border-t border-surface-700/40">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-surface-300">Túnel de navegador</span>
              <span className="text-[11px] text-surface-500">Usar navegador remoto (tunnel) para scraping</span>
            </div>
            <button
              onClick={handleTunnelToggle}
              disabled={tunnelToggling}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none
                disabled:opacity-40 disabled:cursor-not-allowed
                ${browserConfig.tunnelEnabled ? 'bg-primary-600' : 'bg-surface-600'}`}
              aria-checked={browserConfig.tunnelEnabled}
              role="switch"
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                ${browserConfig.tunnelEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



// ─── Search results ────────────────────────────────────────────────────────────

function SearchResultCard({ result, onSelect }: { result: MangaSearchResult; onSelect: (r: MangaSearchResult) => void }) {
  return (
    <button onClick={() => onSelect(result)}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-surface-700/50 bg-surface-800/40 hover:bg-surface-800/70 hover:border-primary-600/40 transition-all text-left w-full group">
      {result.cover
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={result.cover} alt={result.title} className="h-14 w-10 object-cover rounded shrink-0 border border-surface-700/40" />
        : <div className="h-14 w-10 rounded bg-surface-700/40 border border-surface-700/40 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-surface-500" />
          </div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-100 truncate group-hover:text-primary-300 transition-colors">
          {result.title || result.url.split('/').filter(Boolean).pop()}
        </p>
        <p className="text-xs text-surface-500 truncate mt-0.5">{result.url}</p>
      </div>
      <ChevronDown className="h-4 w-4 text-surface-500 -rotate-90 shrink-0 group-hover:text-primary-400 transition-colors" />
    </button>
  );
}

// ─── Chapter selector ──────────────────────────────────────────────────────────

function ChapterSelector({ chapters, selected, downloadedSlugs, onToggle, onToggleAll, onSelectRange }: {
  chapters: MangaChapter[];
  selected: Set<number>;
  downloadedSlugs: Set<string>;
  onToggle: (idx: number) => void;
  onToggleAll: () => void;
  onSelectRange: (from: number, to: number) => void;
}) {
  const allSelected = chapters.length > 0 && chapters.every((_, i) => selected.has(i));
  const [search, setSearch] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const filtered = chapters.map((ch, i) => ({ ch, i }))
    .filter(({ ch }) => !search || ch.title.toLowerCase().includes(search.toLowerCase()));

  const applyRange = () => {
    const from = Math.max(1, parseInt(rangeFrom) || 1);
    const to   = Math.min(chapters.length, parseInt(rangeTo) || chapters.length);
    if (from <= to) onSelectRange(from - 1, to - 1);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter + select-all row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrar capítulos…"
            className="pl-8 h-8 text-xs bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400" />
        </div>
        <button onClick={onToggleAll}
          className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors whitespace-nowrap">
          {allSelected
            ? <><Square className="h-3.5 w-3.5" />Deseleccionar</>
            : <><CheckSquare className="h-3.5 w-3.5" />Selec. todos ({chapters.length})</>}
        </button>
      </div>

      {/* Range selector row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-surface-500 shrink-0">Rango:</span>
        <Input
          type="number" min={1} max={chapters.length} placeholder="1"
          value={rangeFrom} onChange={e => setRangeFrom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyRange()}
          className="w-20 h-7 text-xs bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-500 text-center px-2"
        />
        <span className="text-xs text-surface-500">—</span>
        <Input
          type="number" min={1} max={chapters.length} placeholder={String(chapters.length)}
          value={rangeTo} onChange={e => setRangeTo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyRange()}
          className="w-20 h-7 text-xs bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-500 text-center px-2"
        />
        <button onClick={applyRange}
          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors whitespace-nowrap border border-primary-800/50 hover:border-primary-700/60 rounded px-2 py-1 bg-primary-900/20">
          <CheckSquare className="h-3 w-3" />Seleccionar
        </button>
      </div>
      <div className="rounded-lg border border-surface-700/50 divide-y divide-surface-700/30 max-h-80 overflow-y-auto">
        {filtered.map(({ ch, i }) => {
          const isSelected = selected.has(i);
          const chapterKey = ch.number != null
            ? String(ch.number)
            : ch.title.replace(/[\\/:*?"<>|]/g, '').trim();
          const isDownloaded = downloadedSlugs.has(chapterKey);
          return (
            <div key={i} onClick={() => onToggle(i)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                ${isSelected ? 'bg-primary-900/20 hover:bg-primary-900/30' : isDownloaded ? 'bg-green-900/10 hover:bg-green-900/20' : 'hover:bg-surface-700/20'}`}>
              <Checkbox checked={isSelected} onCheckedChange={() => onToggle(i)} onClick={e => e.stopPropagation()}
                className="border-surface-500 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 shrink-0" />
              <span className={`flex-1 text-xs truncate ${isDownloaded ? 'text-green-300' : 'text-surface-200'}`}>{ch.title}</span>
              {isDownloaded && <HardDrive className="h-3 w-3 text-green-500/70 shrink-0" />}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-surface-500 text-center py-4">Sin resultados.</p>}
      </div>
    </div>
  );
}

// ─── Download progress panel ───────────────────────────────────────────────────

interface ProgressState {
  novelTitle: string;
  total: number;
  completed: number;
  chapters: Array<{ chapter: string; downloaded: number; skipped: number; failed: number }>;
  done: boolean;
  totalDownloaded: number;
  totalFailed: number;
}

function DownloadProgressPanel({ progress }: { progress: ProgressState }) {
  const [showChapters, setShowChapters] = useState(true);
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-surface-300 font-medium">
            {progress.done ? 'Descarga completada' : `Descargando… ${progress.completed} / ${progress.total}`}
          </span>
          <span className="text-surface-400">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-700/60 overflow-hidden">
          <motion.div className={`h-full rounded-full ${progress.done ? 'bg-green-500' : 'bg-primary-500'}`}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ease: 'easeOut', duration: 0.3 }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {progress.totalDownloaded > 0 &&
          <span className="px-2 py-1 rounded-full bg-green-900/30 text-green-300 border border-green-800/40 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />{progress.totalDownloaded} imágenes DL
          </span>}
        {progress.totalFailed > 0 &&
          <span className="px-2 py-1 rounded-full bg-red-900/30 text-red-300 border border-red-800/40 flex items-center gap-1">
            <XCircle className="h-3 w-3" />{progress.totalFailed} fallidas
          </span>}
      </div>
      <button onClick={() => setShowChapters(v => !v)}
        className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors self-start">
        {showChapters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showChapters ? 'Ocultar' : 'Ver'} capítulos ({progress.chapters.length})
      </button>
      {showChapters && (
        <div className="rounded-lg border border-surface-700/50 divide-y divide-surface-700/30 max-h-72 overflow-y-auto">
          {progress.chapters.map(ch => (
            <div key={ch.chapter} className="flex items-center gap-3 px-3 py-2">
              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${ch.failed > 0 ? 'text-yellow-400' : 'text-green-400'}`} />
              <span className="flex-1 text-xs text-surface-300 truncate">{ch.chapter}</span>
              <span className="text-xs text-surface-500 shrink-0">
                {ch.downloaded} DL · {ch.skipped} skip
                {ch.failed > 0 && <span className="text-red-400"> · {ch.failed} err</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MangaDownloader() {
  const setSeriesMetadata = useMangaStore((s) => s.setSeriesMetadata);
  const seriesMetadata = useMangaStore((s) => s.seriesMetadata);

  const [library, setLibrary] = useState<LocalMangaLibrary | null>(null);

  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MangaSearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedNovel, setSelectedNovel] = useState<MangaSearchResult | null>(null);
  const [chapters, setChapters] = useState<MangaChapter[] | null>(null);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());

  const [directUrl, setDirectUrl] = useState('');
  const [directUrlLoading, setDirectUrlLoading] = useState(false);
  const [directUrlError, setDirectUrlError] = useState<string | null>(null);

  const [skipDownloaded, setSkipDownloaded] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalTarget(document.body); }, []);

  const downloadedSlugs = useMemo(() => {
    if (!library || !selectedNovel) return new Set<string>();
    const series = library.series.find(s => s.slug === selectedNovel.title);
    return new Set(series?.chapters.map(c => c.slug) ?? []);
  }, [library, selectedNovel]);

  const loadLibrary = useCallback(async () => {
    const res = await ScrapeService.getLocalMangaLibrary();
    if (res.success && res.data) setLibrary(res.data);
  }, []);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);
    setSelectedNovel(null);
    setChapters(null);
    setSelectedChapters(new Set());
    setProgress(null);
    try {
      const res = await ScrapeService.searchManga(query.trim());
      if (res.success && res.data) setSearchResults(res.data);
      else setSearchError(res.error ?? 'Error al buscar.');
    } catch {
      setSearchError('No se pudo conectar con el servidor.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDirectUrl = async () => {
    const url = directUrl.trim();
    if (!url) return;
    setDirectUrlLoading(true);
    setDirectUrlError(null);
    try {
      const res = await ScrapeService.getNovelInfo(url);
      if (res.success && res.data) {
        setDirectUrl('');
        await handleSelectNovel({ title: res.data.title, url: res.data.url, cover: '' });
      } else {
        setDirectUrlError(res.error ?? 'No se pudo obtener la información de la serie.');
      }
    } catch {
      setDirectUrlError('No se pudo conectar con el servidor.');
    } finally {
      setDirectUrlLoading(false);
    }
  };

  const handleSelectNovel = async (novel: MangaSearchResult) => {
    setSelectedNovel(novel);
    if (novel.title && !seriesMetadata[novel.title]?.title) {
      setSeriesMetadata(novel.title, { ...seriesMetadata[novel.title], title: novel.title });
    }
    setSearchResults(null);
    setChapters(null);
    setSelectedChapters(new Set());
    setProgress(null);
    setChaptersLoading(true);
    setChaptersError(null);
    try {
      const res = await ScrapeService.getMangaChapters(novel.url);
      if (res.success && res.data) setChapters(res.data);
      else setChaptersError(res.error ?? 'Error al obtener capítulos.');
    } catch {
      setChaptersError('No se pudo conectar con el servidor.');
    } finally {
      setChaptersLoading(false);
    }
  };

  const clearNovel = () => {
    setSelectedNovel(null);
    setChapters(null);
    setSelectedChapters(new Set());
    setProgress(null);
    setDownloadError(null);
  };

  const toggleChapter = useCallback((idx: number) => {
    setSelectedChapters(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  }, []);

  const toggleAll = useCallback(() => {
    if (!chapters) return;
    setSelectedChapters(prev => prev.size === chapters.length ? new Set() : new Set(chapters.map((_, i) => i)));
  }, [chapters]);

  const selectRange = useCallback((from: number, to: number) => {
    setSelectedChapters(prev => {
      const next = new Set(prev);
      for (let i = from; i <= to; i++) next.add(i);
      return next;
    });
  }, []);

  const handleDownload = async () => {
    if (!selectedNovel || !chapters || selectedChapters.size === 0) return;
    setDownloading(true);
    setDownloadError(null);
    setProgress(null);

    const sortedIndices = [...selectedChapters].sort((a, b) => a - b);
    const ranges: [number, number][] = [];
    let start = sortedIndices[0], end = sortedIndices[0];
    for (let i = 1; i < sortedIndices.length; i++) {
      if (sortedIndices[i] === end + 1) { end = sortedIndices[i]; }
      else { ranges.push([start + 1, end + 1]); start = sortedIndices[i]; end = sortedIndices[i]; }
    }
    ranges.push([start + 1, end + 1]);

    try {
      for (const [from, to] of ranges) {
        await ScrapeService.streamDownloadMangaNovel(
          { url: selectedNovel.url, from, to, skipDownloaded },
          (event: MangaDownloadSseEvent) => {
            if (event.type === 'start') {
              setProgress(prev => ({
                novelTitle: event.novelTitle,
                total: (prev?.total ?? 0) + event.total,
                completed: prev?.completed ?? 0,
                chapters: prev?.chapters ?? [],
                done: false,
                totalDownloaded: prev?.totalDownloaded ?? 0,
                totalFailed: prev?.totalFailed ?? 0,
              }));
            } else if (event.type === 'chapter') {
              setProgress(prev => prev ? {
                ...prev,
                completed: prev.completed + 1,
                chapters: [...prev.chapters, { chapter: event.chapter, downloaded: event.downloaded, skipped: event.skipped, failed: event.failed }],
                totalDownloaded: prev.totalDownloaded + event.downloaded,
                totalFailed: prev.totalFailed + event.failed,
              } : prev);
            } else if (event.type === 'done') {
              setProgress(prev => prev ? { ...prev, done: true } : prev);
            }
          },
        );
      }
      setSelectedChapters(new Set());
      await loadLibrary();
    } catch (err) {
      setDownloadError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloading(false);
    }
  };

  const selectedCount = selectedChapters.size;

  const stickyBar = selectedCount > 0 && !downloading && portalTarget && createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}
        className="bg-surface-900/95 backdrop-blur border-t border-surface-700/60 shadow-2xl"
      >
        <div className="container mx-auto px-4 py-3 max-w-4xl flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-100">
              {selectedCount} capítulo{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-surface-400 truncate">{selectedNovel?.title}</p>
          </div>
          <span className="text-xs text-surface-500 flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />~{Math.ceil(selectedCount * 1.5)} min est.
          </span>
          <Button onClick={handleDownload} disabled={downloading}
            className="bg-primary-600 hover:bg-primary-500 text-white shrink-0">
            <Download className="h-4 w-4 mr-2" />Descargar selección
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>,
    portalTarget,
  );

  return (
    <>
      <section className="min-h-screen pb-40">
        <div className="max-w-4xl flex flex-col gap-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold text-surface-50">
              Descargador de{' '}
              <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Manga</span>
            </h2>
            <p className="text-surface-400 mt-1 text-sm">
              Busca una serie en NovelCool, elige los capítulos y descárgalos al servidor.
            </p>
          </motion.div>

          {/* Scraper sources */}
          <ScraperSourcesPanel />

          {/* Search */}
          <Card className="bg-surface-800/40 border-surface-700/50">
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                  <Input value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !searchLoading && query.trim() && handleSearch()}
                    placeholder='Buscar serie, ej. "Raeliana"…'
                    className="pl-9 bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400" />
                </div>
                <Button onClick={handleSearch} disabled={searchLoading || !query.trim()}
                  className="bg-primary-600 hover:bg-primary-500 text-white shrink-0">
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2">Buscar</span>
                </Button>
              </div>
              {searchError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{searchError}</p>
              )}
            </CardContent>
          </Card>

          {/* Direct URL */}
          <Card className="bg-surface-800/40 border-surface-700/50">
            <CardContent className="pt-5 flex flex-col gap-3">
              <p className="text-xs text-surface-400 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                O introduce directamente la URL de la serie
              </p>
              <div className="flex gap-2">
                <Input
                  value={directUrl}
                  onChange={e => setDirectUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !directUrlLoading && directUrl.trim() && handleDirectUrl()}
                  placeholder="https://es.novelcool.com/novel/RELIFE.html"
                  className="bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400 text-sm"
                />
                <Button
                  onClick={handleDirectUrl}
                  disabled={directUrlLoading || !directUrl.trim()}
                  variant="outline"
                  className="border-surface-600 hover:bg-surface-700 text-surface-300 shrink-0"
                >
                  {directUrlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
                  <span className="ml-2">Cargar</span>
                </Button>
              </div>
              {directUrlError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{directUrlError}</p>
              )}
            </CardContent>
          </Card>

          {/* Search results */}
          <AnimatePresence>
            {searchResults && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-3">
                <p className="text-sm text-surface-400">
                  {searchResults.length === 0
                    ? 'Sin resultados.'
                    : <><span className="text-surface-200 font-medium">{searchResults.length}</span> resultado{searchResults.length !== 1 ? 's' : ''} — elige una serie</>}
                </p>
                {searchResults.map(r => <SearchResultCard key={r.url} result={r} onSelect={handleSelectNovel} />)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected novel + chapter list */}
          <AnimatePresence>
            {selectedNovel && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="bg-surface-800/40 border-surface-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {selectedNovel.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedNovel.cover} alt={selectedNovel.title}
                          className="h-16 w-12 object-cover rounded border border-surface-700/40 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base text-surface-100 leading-snug">{selectedNovel.title}</CardTitle>
                        <p className="text-xs text-surface-500 mt-0.5 truncate">{selectedNovel.url}</p>
                      </div>
                      <button onClick={clearNovel} className="text-surface-500 hover:text-surface-300 transition-colors shrink-0 mt-0.5">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {chaptersLoading && (
                      <div className="flex items-center gap-2 text-surface-400 text-sm py-4">
                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando capítulos…
                      </div>
                    )}
                    {chaptersError && (
                      <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{chaptersError}</p>
                    )}
                    {selectedNovel && (
                      <details className="group">
                        <summary className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 cursor-pointer select-none list-none py-1">
                          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                          Metadatos EPUB
                        </summary>
                        <div className="mt-3 pt-3 border-t border-surface-700/40">
                          <MangaMetadataForm seriesSlug={selectedNovel.title} />
                        </div>
                      </details>
                    )}

                    {chapters && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-surface-400 flex-wrap">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{chapters.length} capítulos disponibles</span>
                          {downloadedSlugs.size > 0 && (
                            <Badge className="bg-green-900/20 text-green-300 border-green-800/40">
                              {downloadedSlugs.size} descargados
                            </Badge>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-surface-400">Saltar descargados</span>
                            <button
                              onClick={() => setSkipDownloaded(v => !v)}
                              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none
                                ${skipDownloaded ? 'bg-primary-600' : 'bg-surface-600'}`}
                              aria-checked={skipDownloaded}
                              role="switch"
                            >
                              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition-transform
                                ${skipDownloaded ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        </div>
                        <ChapterSelector chapters={chapters} selected={selectedChapters}
                          downloadedSlugs={downloadedSlugs} onToggle={toggleChapter} onToggleAll={toggleAll} onSelectRange={selectRange} />
                      </>
                    )}

                    {downloading && (
                      <div className="flex items-center gap-2 text-sm text-blue-300 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Descargando con Playwright… (puede tardar varios minutos por capítulo)
                      </div>
                    )}
                    {downloadError && (
                      <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{downloadError}</p>
                    )}
                    {progress && (
                      <Card className="bg-surface-900/40 border-surface-700/30">
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-sm text-surface-200 flex items-center gap-2">
                            {progress.done
                              ? <><CheckCircle2 className="h-4 w-4 text-green-400" />Descarga completada</>
                              : <><Loader2 className="h-4 w-4 animate-spin text-primary-400" />Progreso de descarga</>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <DownloadProgressPanel progress={progress} />
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {stickyBar}
    </>
  );
}
