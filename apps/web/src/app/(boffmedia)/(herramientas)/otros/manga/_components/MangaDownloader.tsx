'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MangaService,
  MangaResult, MangaDetail, MangaChapter,
  SseChapterEvent, SseDoneEvent, ChapterDownloadStatus,
} from '@/services/api/boffmedia/mangaService';
import { MangaCard } from './MangaCard';
import { ChapterList } from './ChapterList';
import { FloatingSection } from '@/app/(boffmedia)/_components/layout/FloatingSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import { Input } from '@/components/ui/primitives/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/primitives/select';
import {
  Download, Loader2, Search, CheckCircle2, XCircle, SkipForward,
  Clock, ArrowLeft, ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChapterState {
  title: string;
  status: ChapterDownloadStatus | 'pending';
  filename?: string;
  pages?: number;
  error?: string;
}

interface DownloadProgress {
  chapters: ChapterState[];
  completed: number;
  total: number;
  summary: SseDoneEvent | null;
}

// ── Status UI maps ────────────────────────────────────────────────────────────

const STATUS_ICON: Record<ChapterState['status'], React.ReactNode> = {
  pending:     <Clock        className="h-3.5 w-3.5 text-surface-500 shrink-0" />,
  downloading: <Loader2      className="h-3.5 w-3.5 text-blue-400 shrink-0 animate-spin" />,
  downloaded:  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />,
  skipped:     <SkipForward  className="h-3.5 w-3.5 text-yellow-400 shrink-0" />,
  failed:      <XCircle      className="h-3.5 w-3.5 text-red-400 shrink-0" />,
};
const STATUS_COLOR: Record<ChapterState['status'], string> = {
  pending: 'text-surface-500', downloading: 'text-blue-300',
  downloaded: 'text-green-300', skipped: 'text-yellow-300', failed: 'text-red-300',
};
const STATUS_BG: Record<ChapterState['status'], string> = {
  pending: '', downloading: 'bg-blue-900/10', downloaded: 'bg-green-900/10',
  skipped: 'bg-yellow-900/10', failed: 'bg-red-900/10',
};

// ── CBZ filename derivation (mirrors backend logic) ───────────────────────────

function padChapterNumber(num: string): string {
  const parts = num.split('.');
  const intPart = parts[0].padStart(4, '0');
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

function sanitizeName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.+$/, '').trim().substring(0, 200);
}

function chapterFilename(chapter: MangaChapter): string {
  return `Chapter ${padChapterNumber(chapter.number)} - ${sanitizeName(chapter.title)}.cbz`;
}

// ── Progress panel ─────────────────────────────────────────────────────────────

function DownloadProgressPanel({ progress }: { progress: DownloadProgress }) {
  const [showChapters, setShowChapters] = useState(true);
  const { chapters, completed, total, summary } = progress;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const counts = chapters.reduce<Record<ChapterState['status'], number>>(
    (acc, c) => { acc[c.status]++; return acc; },
    { pending: 0, downloading: 0, downloaded: 0, skipped: 0, failed: 0 },
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      {/* Progress bar */}
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

      {/* Stat pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {counts.downloaded  > 0 && <span className="px-2 py-1 rounded-full bg-green-900/30 text-green-300 border border-green-800/40">{counts.downloaded} descargados</span>}
        {counts.skipped     > 0 && <span className="px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-300 border border-yellow-800/40">{counts.skipped} omitidos</span>}
        {counts.failed      > 0 && <span className="px-2 py-1 rounded-full bg-red-900/30 text-red-300 border border-red-800/40">{counts.failed} fallidos</span>}
        {counts.downloading > 0 && <span className="px-2 py-1 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/40">{counts.downloading} en progreso</span>}
      </div>

      {/* Chapter list */}
      <button
        onClick={() => setShowChapters(v => !v)}
        className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors self-start"
      >
        {showChapters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showChapters ? 'Ocultar' : 'Ver'} capítulos ({chapters.length})
      </button>

      {showChapters && (
        <div className="rounded-lg border border-surface-700/50 divide-y divide-surface-700/30 max-h-80 overflow-y-auto">
          {chapters.map((c, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 transition-colors duration-300 ${STATUS_BG[c.status]}`}
            >
              {STATUS_ICON[c.status]}
              <span className={`flex-1 text-xs truncate ${STATUS_COLOR[c.status]}`} title={c.title}>{c.title}</span>
              {c.pages != null && <span className="text-xs text-surface-500 shrink-0">{c.pages} págs.</span>}
              {c.error && <span className="text-xs text-red-500 truncate max-w-[160px]" title={c.error}>{c.error}</span>}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type View = 'search' | 'detail';

export default function MangaDownloader() {
  // Search
  const [query, setQuery]             = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<MangaResult[]>([]);

  // Detail view
  const [view, setView]               = useState<View>('search');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [mangaDetail, setMangaDetail] = useState<MangaDetail | null>(null);
  const [localFiles, setLocalFiles]   = useState<Set<string>>(new Set());

  // Chapter selection
  const [selected, setSelected]       = useState<Set<string>>(new Set()); // chapter URLs

  // Download
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress]       = useState<DownloadProgress | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [concurrency, setConcurrency] = useState('1');

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);
    setView('search');
    try {
      const res = await MangaService.search(query.trim());
      if (res.success && res.data) setSearchResults(res.data.results);
      else setSearchError(res.error ?? res.message ?? 'Error al buscar.');
    } catch {
      setSearchError('No se pudo conectar con el servidor.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectManga = async (manga: MangaResult) => {
    setDetailLoading(true);
    setDetailError(null);
    setMangaDetail(null);
    setSelected(new Set());
    setProgress(null);
    setView('detail');

    try {
      const [detailRes, localRes] = await Promise.all([
        MangaService.getDetail(manga.url),
        MangaService.getLocalChapters(manga.title),
      ]);

      if (detailRes.success && detailRes.data) setMangaDetail(detailRes.data);
      else setDetailError(detailRes.error ?? 'Error al cargar el manga.');

      if (localRes.success && localRes.data) {
        setLocalFiles(new Set(localRes.data.files));
      }
    } catch {
      setDetailError('No se pudo cargar el detalle del manga.');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshLocalFiles = async () => {
    if (!mangaDetail) return;
    try {
      const res = await MangaService.getLocalChapters(mangaDetail.title);
      if (res.success && res.data) setLocalFiles(new Set(res.data.files));
    } catch { /* non-critical */ }
  };

  const toggleChapter = useCallback((url: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!mangaDetail) return;
    setSelected(new Set(mangaDetail.chapters.map(c => c.url)));
  }, [mangaDetail]);

  const selectMissing = useCallback(() => {
    if (!mangaDetail) return;
    const missing = mangaDetail.chapters.filter(c => !localFiles.has(chapterFilename(c)));
    setSelected(new Set(missing.map(c => c.url)));
  }, [mangaDetail, localFiles]);

  const clearAll = useCallback(() => setSelected(new Set()), []);

  const handleDownload = async () => {
    if (!mangaDetail || selected.size === 0) return;

    const chapterMap = new Map(mangaDetail.chapters.map(c => [c.url, c]));
    const chaptersToDownload = [...selected]
      .map(url => chapterMap.get(url))
      .filter((c): c is MangaChapter => !!c);

    if (!chaptersToDownload.length) return;

    const initialState: DownloadProgress = {
      chapters: chaptersToDownload.map(c => ({ title: c.title, status: 'pending' })),
      completed: 0,
      total: chaptersToDownload.length,
      summary: null,
    };

    setProgress(initialState);
    setDownloading(true);
    setDownloadError(null);
    setSelected(new Set());

    try {
      await MangaService.streamDownloadChapters(
        {
          seriesName: mangaDetail.title,
          chapters: chaptersToDownload.map(c => ({ title: c.title, url: c.url, number: c.number })),
          concurrency: Number(concurrency),
          mangaUrl: mangaDetail.url,
        },
        (event) => {
          if (event.type === 'chapter') {
            const ev = event as SseChapterEvent;
            setProgress(prev => {
              if (!prev) return prev;
              const chapters = [...prev.chapters];
              const idx = chapters.findIndex(c => c.title === ev.title);
              const updated: ChapterState = {
                title: ev.title,
                status: ev.status,
                filename: ev.filename,
                pages: ev.pages,
                error: ev.error,
              };
              if (idx !== -1) chapters[idx] = updated;

              const isDone = ev.status !== 'downloading';
              return {
                ...prev,
                chapters,
                completed: isDone ? prev.completed + 1 : prev.completed,
              };
            });
          } else if (event.type === 'done') {
            const ev = event as SseDoneEvent;
            setProgress(prev => prev
              ? { ...prev, completed: prev.total, summary: ev }
              : prev,
            );
          }
        },
      );
    } catch (err) {
      setDownloadError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloading(false);
      await refreshLocalFiles();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <FloatingSection className="min-h-screen pb-40">
      <div className="container mx-auto px-4 py-10 max-w-4xl flex flex-col gap-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            {view === 'detail' && (
              <button
                onClick={() => { setView('search'); setSelected(new Set()); setProgress(null); }}
                className="text-surface-400 hover:text-surface-200 transition-colors"
                title="Volver a búsqueda"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-surface-50">
                Descargador{' '}
                <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  Manga
                </span>
              </h1>
              <p className="text-surface-400 mt-1 text-sm">
                Busca manga, selecciona capítulos y descárgalos como archivos .cbz.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search bar */}
        <Card className="bg-surface-800/40 border-surface-700/50">
          <CardContent className="pt-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !searchLoading && handleSearch()}
                  placeholder='"Raeliana", "Solo Leveling"…'
                  className="pl-9 bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searchLoading || !query.trim()}
                className="bg-primary-600 hover:bg-primary-500 text-white shrink-0"
              >
                {searchLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Search className="h-4 w-4" />
                }
                <span className="ml-2">Buscar</span>
              </Button>
            </div>
            {searchError && (
              <p className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{searchError}</p>
            )}
          </CardContent>
        </Card>

        {/* ── SEARCH RESULTS ── */}
        <AnimatePresence mode="wait">
          {view === 'search' && searchResults.length > 0 && (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-surface-400 mb-4">
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para{' '}
                <span className="text-primary-300 font-medium">"{query}"</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {searchResults.map(manga => (
                  <MangaCard key={manga.url} manga={manga} onClick={() => handleSelectManga(manga)} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── DETAIL VIEW ── */}
          {view === 'detail' && (
            <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">

              {detailLoading && (
                <div className="flex items-center gap-3 text-surface-400 py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Cargando detalles del manga…</span>
                </div>
              )}

              {detailError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{detailError}</p>
              )}

              {mangaDetail && (
                <>
                  {/* Manga header */}
                  <div className="flex gap-4">
                    {mangaDetail.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mangaDetail.coverUrl}
                        alt={mangaDetail.title}
                        className="w-24 rounded-lg object-cover shrink-0 border border-surface-700/50"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="flex flex-col gap-2 min-w-0">
                      <h2 className="text-xl font-bold text-surface-50 leading-snug">{mangaDetail.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-surface-400">
                        <BookOpen className="h-4 w-4" />
                        <span>{mangaDetail.chapterCount} capítulos</span>
                        <span className="text-surface-600">·</span>
                        <span>{mangaDetail.source}</span>
                      </div>
                      {mangaDetail.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {mangaDetail.tags.slice(0, 6).map(tag => (
                            <Badge key={tag} className="text-[11px] bg-surface-700/60 text-surface-400 border-surface-600/40">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chapter list */}
                  <Card className="bg-surface-800/40 border-surface-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-surface-200">
                        Capítulos
                        {localFiles.size > 0 && (
                          <span className="ml-2 text-sm font-normal text-green-400">({localFiles.size} descargados)</span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChapterList
                        chapters={mangaDetail.chapters}
                        selected={selected}
                        localFiles={localFiles}
                        onToggle={toggleChapter}
                        onSelectAll={selectAll}
                        onSelectMissing={selectMissing}
                        onClearAll={clearAll}
                        toFilename={chapterFilename}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Download progress */}
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
        {selected.size > 0 && !downloading && (
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
                  {selected.size} capítulo{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
                </p>
                {mangaDetail && (
                  <p className="text-xs text-surface-400">{mangaDetail.title}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-surface-400">Concurrencia:</span>
                <Select value={concurrency} onValueChange={setConcurrency}>
                  <SelectTrigger className="h-8 w-16 bg-surface-800 border-surface-600 text-surface-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-800 border-surface-700">
                    {['1', '2', '3'].map(n => (
                      <SelectItem key={n} value={n} className="text-surface-200">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {downloadError && <p className="text-xs text-red-400 max-w-xs truncate">{downloadError}</p>}
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-primary-600 hover:bg-primary-500 text-white shrink-0"
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
