'use client';

import { useState, useCallback, useEffect } from 'react';
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
  Library, RefreshCw, BookMarked, ImageIcon, X,
} from 'lucide-react';
import {
  ScrapeService,
  type MangaSearchResult,
  type MangaChapter,
  type MangaDownloadSseEvent,
  type LocalMangaLibrary,
  type LocalMangaSeries,
} from '@/services/api/boffmedia/scrapeService';
import { FloatingSection } from '@/app/(boffmedia)/_components/layout/FloatingSection';

// ─── Local library ─────────────────────────────────────────────────────────────

function SeriesCard({ series }: { series: LocalMangaSeries }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-surface-700/50 overflow-hidden">
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-800/60 hover:bg-surface-800/80 transition-colors text-left">
        <BookMarked className="h-4 w-4 text-primary-400 shrink-0" />
        <span className="text-sm font-semibold text-surface-100 truncate flex-1">{series.slug}</span>
        <Badge className="bg-surface-700/40 text-surface-300 border-surface-600/40 shrink-0">
          {series.chapters.length} cap.
        </Badge>
        <Badge className="bg-surface-700/40 text-surface-400 border-surface-600/40 shrink-0 flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />{series.totalImages}
        </Badge>
        {expanded ? <ChevronUp className="h-4 w-4 text-surface-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-surface-500 shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="divide-y divide-surface-700/30">
              {series.chapters.map(ch => (
                <div key={ch.slug} className="flex items-center gap-3 px-4 py-2 hover:bg-surface-700/20">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500/70 shrink-0" />
                  <span className="flex-1 text-xs text-surface-300 truncate">{ch.slug}</span>
                  <span className="text-xs text-surface-500 shrink-0 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />{ch.imageCount}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LocalLibraryPanel({ library, onRefresh, loading }: {
  library: LocalMangaLibrary; onRefresh: () => void; loading: boolean;
}) {
  return (
    <Card className="bg-surface-800/40 border-surface-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base text-surface-200 flex items-center gap-2">
            <Library className="h-4 w-4 text-primary-400" />Biblioteca local
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-400">
              {library.totalSeries} serie{library.totalSeries !== 1 ? 's' : ''} · {library.totalChapters} cap.
            </span>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}
              className="h-7 border-surface-600 hover:bg-surface-700 text-surface-300 gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {library.totalSeries === 0
          ? <p className="text-sm text-surface-500 text-center py-6">No hay manga descargado todavía.</p>
          : <div className="flex flex-col gap-2">{library.series.map(s => <SeriesCard key={s.slug} series={s} />)}</div>}
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

function ChapterSelector({ chapters, selected, downloadedSlugs, onToggle, onToggleAll }: {
  chapters: MangaChapter[];
  selected: Set<number>;
  downloadedSlugs: Set<string>;
  onToggle: (idx: number) => void;
  onToggleAll: () => void;
}) {
  const allSelected = chapters.length > 0 && chapters.every((_, i) => selected.has(i));
  const [search, setSearch] = useState('');
  const filtered = chapters.map((ch, i) => ({ ch, i }))
    .filter(({ ch }) => !search || ch.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
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
      <div className="rounded-lg border border-surface-700/50 divide-y divide-surface-700/30 max-h-80 overflow-y-auto">
        {filtered.map(({ ch, i }) => {
          const isSelected = selected.has(i);
          const slug = ch.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
          const isDownloaded = downloadedSlugs.has(slug);
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
  const [library, setLibrary] = useState<LocalMangaLibrary | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MangaSearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedNovel, setSelectedNovel] = useState<MangaSearchResult | null>(null);
  const [chapters, setChapters] = useState<MangaChapter[] | null>(null);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Portal mount target
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalTarget(document.body); }, []);

  const downloadedSlugs = (() => {
    if (!library || !selectedNovel) return new Set<string>();
    const titleSlug = (selectedNovel.title || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const series = library.series.find(s => s.slug === titleSlug);
    return new Set(series?.chapters.map(c => c.slug) ?? []);
  })();

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await ScrapeService.getLocalMangaLibrary();
      if (res.success && res.data) setLibrary(res.data);
    } finally {
      setLibraryLoading(false);
    }
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

  const handleSelectNovel = async (novel: MangaSearchResult) => {
    setSelectedNovel(novel);
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

  const handleDownload = async () => {
    if (!selectedNovel || !chapters || selectedChapters.size === 0) return;
    setDownloading(true);
    setDownloadError(null);
    setProgress(null);

    const sortedIndices = [...selectedChapters].sort((a, b) => a - b);
    // Build contiguous ranges (1-based)
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
          { url: selectedNovel.url, from, to },
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
      <FloatingSection className="min-h-screen pb-40">
        <div className="container mx-auto px-4 py-10 max-w-4xl flex flex-col gap-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-surface-50">
              Descargador de{' '}
              <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Manga</span>
            </h1>
            <p className="text-surface-400 mt-1 text-sm">
              Busca una serie en NovelCool, elige los capítulos y descárgalos al servidor.
            </p>
          </motion.div>

          {/* Local library */}
          <AnimatePresence>
            {(library || libraryLoading) && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                {libraryLoading && !library
                  ? <Card className="bg-surface-800/40 border-surface-700/50">
                      <CardContent className="pt-5 flex items-center gap-2 text-surface-400 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando biblioteca…
                      </CardContent>
                    </Card>
                  : library && <LocalLibraryPanel library={library} onRefresh={loadLibrary} loading={libraryLoading} />}
              </motion.div>
            )}
          </AnimatePresence>

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
                    {chapters && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-surface-400">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{chapters.length} capítulos disponibles</span>
                          {downloadedSlugs.size > 0 && (
                            <Badge className="bg-green-900/20 text-green-300 border-green-800/40">
                              {downloadedSlugs.size} descargados
                            </Badge>
                          )}
                        </div>
                        <ChapterSelector chapters={chapters} selected={selectedChapters}
                          downloadedSlugs={downloadedSlugs} onToggle={toggleChapter} onToggleAll={toggleAll} />
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
      </FloatingSection>

      {/* Sticky bar — portalled to body to escape stacking contexts and the footer */}
      {stickyBar}
    </>
  );
}
