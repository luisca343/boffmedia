"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Check, ChevronDown, ChevronRight, EyeOff, FileText,
  Library, Loader2, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Checkbox } from "@/components/ui/primitives/checkbox";
import { cn } from "@/lib/utils";
import { ScrapeService } from "@/services/api/boffmedia/scrapeService";
import { useMangaStore } from "@/stores/useMangaStore";
import MangaMetadataForm from "./MangaMetadataForm";
import { FloatingSection } from "@/app/(boffmedia)/_components/layout/FloatingSection";

// Session-only scroll memory for the library grid
let _libraryScrollY = 0;

interface BulkState {
  total: number;
  done: number;
  currentSlug: string | null;
  errors: string[];
  finished: boolean;
}

// ── Inline chapter row with expandable page picker ────────────────────────────

interface ChapterDef {
  slug: string;
  hasCbz: boolean;
  hasEpub: boolean;
  imageCount: number;
}

function ChapterRow({
  chapter,
  seriesSlug,
  isSelected,
  isExpanded,
  isConverted,
  isExporting,
  isLoading,
  hasError,
  onToggleSelect,
  onToggleExpand,
}: {
  chapter: ChapterDef;
  seriesSlug: string;
  isSelected: boolean;
  isExpanded: boolean;
  isConverted: boolean;
  isExporting: boolean;
  isLoading: boolean;
  hasError: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}) {
  const t = useTranslations("boffmedia.mangaLibrary");

  const chapterPages = useMangaStore((s) => s.chapterPages[chapter.slug] ?? []);
  const togglePage = useMangaStore((s) => s.togglePage);
  const setPages = useMangaStore((s) => s.setPages);
  const excludedArr = useMangaStore((s) => s.pageSelections[chapter.slug] ?? []);
  const excludedSet = useMemo(() => new Set<number>(excludedArr), [excludedArr]);

  const totalPages = chapterPages.length || chapter.imageCount;
  const includedCount = chapterPages.length ? chapterPages.length - excludedSet.size : chapter.imageCount;
  const hasEpub = chapter.hasEpub || isConverted;

  const keepAll = useCallback(() => setPages(chapter.slug, []), [chapter.slug, setPages]);
  const excludeAll = useCallback(() => {
    if (chapterPages.length) setPages(chapter.slug, chapterPages.map((p) => p.index));
  }, [chapter.slug, chapterPages, setPages]);
  const invertSelection = useCallback(() => {
    if (chapterPages.length)
      setPages(chapter.slug, chapterPages.map((p) => p.index).filter((i) => !excludedSet.has(i)));
  }, [chapter.slug, chapterPages, excludedSet, setPages]);

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden transition-colors",
      isSelected
        ? "border-primary-600/50 bg-primary-900/10"
        : "border-surface-700/50 bg-surface-900/30 hover:border-surface-600/60",
    )}>
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select ${chapter.slug}`}
          disabled={isExporting}
          className="shrink-0"
        />

        {/* Title — clicking expands */}
        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-2 text-left min-w-0 group"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Contraer" : "Expandir"} páginas de ${chapter.slug}`}
        >
          <FileText className={cn(
            "w-3.5 h-3.5 shrink-0 transition-colors",
            isSelected ? "text-primary-400" : "text-surface-500 group-hover:text-surface-300",
          )} />
          <span className={cn(
            "flex-1 text-sm font-medium truncate transition-colors",
            isSelected ? "text-primary-200" : "text-surface-200 group-hover:text-surface-100",
          )}>
            {chapter.slug}
          </span>
        </button>

        {/* Right-side metadata + badges + toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isExpanded && chapterPages.length > 0 ? (
            <span className="text-[10px] tabular-nums text-surface-500">
              {includedCount}<span className="text-surface-700">/{totalPages}</span>
            </span>
          ) : (
            <span className="text-[10px] tabular-nums text-surface-600">{totalPages}p</span>
          )}

          {chapter.hasCbz && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-surface-600 text-surface-400">
              {t("cbz")}
            </Badge>
          )}
          {hasEpub && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary-600/60 text-primary-400">
              {t("epub")}
            </Badge>
          )}

          <button
            onClick={onToggleExpand}
            tabIndex={-1}
            aria-hidden
            className="p-0.5 rounded text-surface-500 hover:text-surface-200 transition-colors"
          >
            <ChevronDown className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              isExpanded && "rotate-180",
            )} />
          </button>
        </div>
      </div>

      {/* Inline page picker (expanded) */}
      {isExpanded && (
        <div className="border-t border-surface-700/40 px-3 py-3 space-y-2.5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-surface-400 text-xs py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />Cargando páginas…
            </div>
          ) : hasError ? (
            <p className="text-xs text-red-400 py-1">{t("errorLoadingPages")}</p>
          ) : chapterPages.length === 0 ? (
            <p className="text-xs text-surface-500 py-1">Sin páginas disponibles.</p>
          ) : (
            <>
              {/* Per-chapter quick actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={keepAll}
                  className="text-[11px] px-2 py-0.5 rounded border border-surface-600/70 text-surface-400 hover:text-surface-100 hover:border-surface-500 transition-colors">
                  Incluir todo
                </button>
                <button onClick={excludeAll}
                  className="text-[11px] px-2 py-0.5 rounded border border-surface-600/70 text-surface-400 hover:text-surface-100 hover:border-surface-500 transition-colors">
                  Excluir todo
                </button>
                <button onClick={invertSelection}
                  className="text-[11px] px-2 py-0.5 rounded border border-surface-600/70 text-surface-400 hover:text-surface-100 hover:border-surface-500 transition-colors">
                  Invertir
                </button>
                {excludedSet.size > 0 && (
                  <span className="ml-auto text-[11px] text-red-400">
                    {excludedSet.size} excluida{excludedSet.size !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Thumbnail grid */}
              <div
                role="group"
                aria-label={`Páginas de ${chapter.slug}`}
                className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1"
              >
                {chapterPages.map((page) => {
                  const excluded = excludedSet.has(page.index);
                  return (
                    <button
                      key={page.index}
                      type="button"
                      onClick={() => togglePage(chapter.slug, page.index)}
                      className="relative aspect-[2/3] overflow-hidden rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-400"
                      aria-label={`Página ${page.index + 1}${excluded ? " (excluida)" : ""}`}
                      aria-pressed={excluded}
                    >
                      { }
                      <img
                        src={ScrapeService.getChapterImageUrl(seriesSlug, chapter.slug, page.index)}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] text-center py-px leading-none">
                        {page.index + 1}
                      </span>
                      {excluded ? (
                        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center">
                          <EyeOff className="w-2.5 h-2.5 text-white" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 hover:bg-white/10 transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function MangaLibraryInner() {
  const [refreshingLibrary, setRefreshingLibrary] = useState(false);
  const [errorRefreshing, setErrorRefreshing] = useState(false);
  const t = useTranslations("boffmedia.mangaLibrary");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Store
  const library = useMangaStore((s) => s.library);
   const setLibrary = useMangaStore((s) => s.setLibrary);
   const clearSelectionsForSeries = useMangaStore((s) => s.clearSelectionsForSeries);
   const clearChapterPagesForSeries = useMangaStore((s) => s.clearChapterPagesForSeries);
  const chapterPagesMap = useMangaStore((s) => s.chapterPages);
  const pageSelections = useMangaStore((s) => s.pageSelections);
  const seriesMetadata = useMangaStore((s) => s.seriesMetadata);

  // URL state
  const seriesSlug = searchParams.get("series");
  const selectedSeries = library?.series.find((s) => s.slug === seriesSlug) ?? null;

  // UI state
  const [loadingLibrary, setLoadingLibrary] = useState(!library);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loadingChapters, setLoadingChapters] = useState<Set<string>>(new Set());
  const [errorChapters, setErrorChapters] = useState<Set<string>>(new Set());
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [showMetadata, setShowMetadata] = useState(false);
  const [converted, setConverted] = useState<Map<string, Set<string>>>(new Map());
  const [bulk, setBulk] = useState<BulkState | null>(null);
  const [includeCover, setIncludeCover] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [removeFirst, setRemoveFirst] = useState(0);
  const [removeLast, setRemoveLast] = useState(0);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const [patching, setPatching] = useState(false);
  const [patchResult, setPatchResult] = useState<{ updated: number; total: number } | null>(null);

  const prevSeriesRef = useRef<string | null>(null);

  useEffect(() => { setPortalTarget(document.body); }, []);

  // Reset chapter state when navigating to a different series
  useEffect(() => {
    if (prevSeriesRef.current !== seriesSlug) {
      setExpandedChapters(new Set());
      setSelectedChapters(new Set());
      setBulk(null);
      setShowMetadata(false);
    }
  }, [seriesSlug]);

  // Preserve library scroll position when entering/leaving a series
  useEffect(() => {
    const wasInLibrary = prevSeriesRef.current === null;
    const isInLibrary = seriesSlug === null;
    if (wasInLibrary && !isInLibrary) _libraryScrollY = window.scrollY;
    else if (!wasInLibrary && isInLibrary)
      requestAnimationFrame(() => window.scrollTo({ top: _libraryScrollY, behavior: "instant" }));
    prevSeriesRef.current = seriesSlug;
  }, [seriesSlug]);

  // Load library (use persisted cache; re-fetches when cache is cleared)
  useEffect(() => {
    if (library) { setLoadingLibrary(false); return; }
    setLoadingLibrary(true);
    ScrapeService.getLocalMangaLibrary().then((res) => {
      if (res.success && res.data) setLibrary(res.data);
      setLoadingLibrary(false);
    });
  }, [library, setLibrary]);

  // ── Navigation — always merge params to preserve ?section= ──────────────────
  function openSeries(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("series", slug);
    params.delete("chapter");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToLibrary() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("series");
    params.delete("chapter");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // ── Chapter expansion + lazy page loading ────────────────────────────────────
  async function toggleExpand(chapterSlug: string) {
    const isExpanded = expandedChapters.has(chapterSlug);
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      isExpanded ? next.delete(chapterSlug) : next.add(chapterSlug);
      return next;
    });
    // Load pages on first expansion if not cached
    if (!isExpanded && !chapterPagesMap[chapterSlug]) {
      setLoadingChapters((prev) => new Set([...prev, chapterSlug]));
      setErrorChapters((prev) => { const next = new Set(prev); next.delete(chapterSlug); return next; });
      const res = await ScrapeService.getChapterPageList(seriesSlug!, chapterSlug);
      setLoadingChapters((prev) => { const next = new Set(prev); next.delete(chapterSlug); return next; });
      if (res.success && res.data) {
        useMangaStore.getState().setChapterPages(chapterSlug, res.data);
      } else {
        setErrorChapters((prev) => new Set([...prev, chapterSlug]));
      }
    }
  }

  // ── Selection helpers ────────────────────────────────────────────────────────
  function toggleChapterSelect(slug: string) {
    setSelectedChapters((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!selectedSeries) return;
    const allSlugs = selectedSeries.chapters.map((c) => c.slug);
    setSelectedChapters(selectedChapters.size === allSlugs.length ? new Set() : new Set(allSlugs));
  }

  // ── Export helpers ───────────────────────────────────────────────────────────
  function markConverted(series: string, slug: string) {
    setConverted((prev) => {
      const next = new Map(prev);
      const slugs = new Set(next.get(series) ?? []);
      slugs.add(slug);
      next.set(series, slugs);
      return next;
    });
  }

  function refreshLibrary() {
    ScrapeService.getLocalMangaLibrary().then((r) => {
      if (r.success && r.data) setLibrary(r.data);
    });
  }

  async function handleBulkExport() {
    if (!selectedSeries || selectedChapters.size === 0) return;
    const chapters = selectedSeries.chapters.filter((c) => selectedChapters.has(c.slug));
    setBulk({ total: chapters.length, done: 0, currentSlug: null, errors: [], finished: false });

    for (const ch of chapters) {
      setBulk((prev) => prev ? { ...prev, currentSlug: ch.slug } : prev);

      // Use per-chapter page selections if set, otherwise fall back to removeFirst/removeLast pattern
      const storedExcluded = pageSelections[ch.slug] ?? [];
      let excludePages = storedExcluded;
      if (storedExcluded.length === 0 && (removeFirst > 0 || removeLast > 0)) {
        const totalPgs = chapterPagesMap[ch.slug]?.length ?? ch.imageCount;
        const exc = new Set<number>();
        for (let i = 0; i < Math.min(removeFirst, totalPgs); i++) exc.add(i);
        for (let i = Math.max(0, totalPgs - removeLast); i < totalPgs; i++) exc.add(i);
        excludePages = Array.from(exc);
      }

      const res = await ScrapeService.convertMangaChapter(
        selectedSeries.slug, ch.slug, excludePages, includeCover,
        seriesMetadata[selectedSeries.slug],
      ).catch(() => null);

      if (res?.success) markConverted(selectedSeries.slug, ch.slug);
      setBulk((prev) => prev ? {
        ...prev,
        done: prev.done + 1,
        errors: res?.success ? prev.errors : [...prev.errors, ch.slug],
      } : prev);
    }

    setBulk((prev) => prev ? { ...prev, currentSlug: null, finished: true } : prev);
    refreshLibrary();
  }

  async function handlePatchMetadata(slugs?: string[]) {
    if (!selectedSeries) return;
    const meta = seriesMetadata[selectedSeries.slug] ?? {};
    const convertedSet = converted.get(selectedSeries.slug) ?? new Set<string>();
    const targetSlugs = slugs ?? selectedSeries.chapters
      .filter((c) => c.hasEpub || convertedSet.has(c.slug))
      .map((c) => c.slug);
    if (targetSlugs.length === 0) return;
    setPatching(true);
    setPatchResult(null);
    const res = await ScrapeService.patchEpubMetadata(selectedSeries.slug, targetSlugs, meta).catch(() => null);
    if (res?.success && res.data) {
      setPatchResult({ updated: res.data.updated, total: res.data.results.length });
    }
    setPatching(false);
  }

  // ── Export summary (live) ────────────────────────────────────────────────────
  const exportSummary = useMemo(() => {
    if (!selectedSeries || selectedChapters.size === 0) return null;
    const chapters = selectedSeries.chapters.filter((c) => selectedChapters.has(c.slug));
    let totalIncluded = 0, totalPages = 0;
    for (const ch of chapters) {
      const pages = chapterPagesMap[ch.slug];
      const excluded = new Set<number>(pageSelections[ch.slug] ?? []);
      if (pages) {
        totalPages += pages.length;
        totalIncluded += pages.length - excluded.size;
      } else {
        totalPages += ch.imageCount;
        totalIncluded += ch.imageCount;
      }
    }
    return { count: chapters.length, totalIncluded, totalPages };
  }, [selectedChapters, selectedSeries, chapterPagesMap, pageSelections]);

  // ── Export bar (portalled to body) ───────────────────────────────────────────
  const allEpubOnly = selectedSeries !== null && selectedChapters.size > 0 &&
    [...selectedChapters].every((slug) => {
      const ch = selectedSeries.chapters.find((c) => c.slug === slug);
      return ch && ch.hasEpub && !ch.hasCbz && !converted.get(selectedSeries.slug)?.has(slug);
    });

  const exportBar = exportSummary && portalTarget
    ? createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
          <div className="pointer-events-auto mb-5 mx-4 bg-surface-800/95 backdrop-blur-sm border border-surface-700/60 rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full">
            {/* Main row */}
            <div className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-100">
                  {exportSummary.count} capítulo{exportSummary.count !== 1 ? "s" : ""} seleccionado{exportSummary.count !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-surface-400">
                  {exportSummary.totalIncluded} pág. incluidas
                  {exportSummary.totalIncluded < exportSummary.totalPages && (
                    <span className="text-surface-600"> / {exportSummary.totalPages} total</span>
                  )}
                </p>
              </div>

              {/* Progress during export */}
              {bulk && !bulk.finished && (
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-surface-400">{bulk.done}/{bulk.total}</span>
                  {bulk.currentSlug && (
                    <span className="text-[10px] text-surface-600 max-w-[8rem] truncate">{bulk.currentSlug}</span>
                  )}
                </div>
              )}
              {bulk?.finished && (
                <span className="text-sm text-green-400 shrink-0 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {bulk.done - bulk.errors.length} ok
                  {bulk.errors.length > 0 && <span className="text-red-400 ml-1">· {bulk.errors.length} err</span>}
                </span>
              )}

              <label className="flex items-center gap-1.5 text-xs text-surface-400 cursor-pointer select-none shrink-0">
                <Checkbox checked={includeCover} onCheckedChange={(v) => setIncludeCover(!!v)} />
                Portada
              </label>

              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs text-surface-500 hover:text-surface-300 transition-colors shrink-0"
              >
                {showAdvanced ? "Básico" : "Avanzado"}
              </button>

              {(() => {
                const convertedSet = converted.get(selectedSeries?.slug ?? "") ?? new Set<string>();
                const epubSlugs = (selectedSeries?.chapters ?? [])
                  .filter((c) => selectedChapters.has(c.slug) && (c.hasEpub || convertedSet.has(c.slug)))
                  .map((c) => c.slug);
                return epubSlugs.length > 0 ? (
                  <Button
                    onClick={() => handlePatchMetadata(epubSlugs)}
                    disabled={patching || (!!bulk && !bulk.finished)}
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-surface-600 hover:bg-surface-700 text-surface-300"
                  >
                    {patching
                      ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Actualizando…</>
                      : "Actualizar metadatos"}
                  </Button>
                ) : null;
              })()}

              <Button
                onClick={handleBulkExport}
                disabled={!!bulk && !bulk.finished}
                size="sm"
                className="shrink-0"
              >
                {bulk && !bulk.finished
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Procesando…</>
                  : <><FileText className="w-3.5 h-3.5 mr-1.5" />{allEpubOnly ? "Actualizar EPUB" : "Exportar EPUB"}</>}
              </Button>
            </div>

            {/* Advanced: pattern for chapters without manual page selection */}
            {showAdvanced && (
              <div className="border-t border-surface-700/50 px-5 py-2.5 flex items-center gap-4 flex-wrap">
                <span className="text-[11px] text-surface-500 shrink-0">
                  Patrón (capítulos sin selección manual):
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-surface-400 shrink-0">
                  Quitar primeras
                  <input
                    type="number" min={0} max={99} value={removeFirst}
                    onChange={(e) => setRemoveFirst(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 rounded bg-surface-700 border border-surface-600 text-surface-100 text-center text-xs px-1 py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-surface-400 shrink-0">
                  Quitar últimas
                  <input
                    type="number" min={0} max={99} value={removeLast}
                    onChange={(e) => setRemoveLast(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 rounded bg-surface-700 border border-surface-600 text-surface-100 text-center text-xs px-1 py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </label>
              </div>
            )}
          </div>
        </div>,
        portalTarget,
      )
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <FloatingSection className="pb-32">
      <AnimatePresence mode="wait">

        {/* ── LIBRARY VIEW ── */}
        {!seriesSlug && (
          <motion.div
            key="library"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <Library className="w-6 h-6 text-primary-400 shrink-0" />
              <h2 className="text-xl font-bold flex-1">
                <span className="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
                  {t("title")}
                </span>
              </h2>
<button
  onClick={async () => {
    setRefreshingLibrary(true);
    setErrorRefreshing(false);
    try {
      const res = await ScrapeService.getLocalMangaLibrary();
      if (res.success && res.data) setLibrary(res.data);
      else setErrorRefreshing(true);
    } catch {
      setErrorRefreshing(true);
    } finally {
      setRefreshingLibrary(false);
    }
  }}
  className={`text-surface-500 hover:text-surface-200 transition-colors p-1.5 rounded hover:bg-surface-700/40 ${refreshingLibrary ? 'opacity-50 cursor-not-allowed' : ''}`}
  aria-label={t("refreshLibrary")} title={t("refreshLibrary")}
  disabled={refreshingLibrary}
>
  {refreshingLibrary ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <RefreshCw className="w-4 h-4" />
  )}
</button>
{errorRefreshing && (
  <span className="ml-2 text-xs text-red-400">Error al recargar</span>
)}

            </div>

            {loadingLibrary ? (
              <div className="flex items-center gap-2 text-surface-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : !library?.series.length ? (
              <Card>
                <CardContent className="py-12 text-center text-surface-400">{t("noSeries")}</CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {library.series.map((series) => (
                  <button key={series.slug} onClick={() => openSeries(series.slug)} className="text-left">
                    <Card className="hover:border-primary-500/50 transition-colors cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base leading-snug line-clamp-2">{series.slug}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                        <span className="text-sm text-surface-400">{series.chapters.length} {t("chapters")}</span>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SERIES VIEW ── */}
        {seriesSlug && (
          <motion.div
            key="series"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-surface-400 mb-5">
              <button onClick={goToLibrary} className="hover:text-surface-100 transition-colors flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5 shrink-0" />
                {t("backToLibrary")}
              </button>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-surface-100 font-medium truncate flex-1 min-w-0">{seriesSlug}</span>
              <button
  onClick={async () => {
    setRefreshingLibrary(true);
    setErrorRefreshing(false);
    try {
      const res = await ScrapeService.getLocalMangaLibrary();
      if (res.success && res.data) {
        setLibrary(res.data);
        clearSelectionsForSeries(seriesSlug!);
        clearChapterPagesForSeries(seriesSlug!);
      } else setErrorRefreshing(true);
    } catch {
      setErrorRefreshing(true);
    } finally {
      setRefreshingLibrary(false);
    }
  }}
  className={`text-surface-500 hover:text-surface-200 transition-colors p-1 rounded hover:bg-surface-700/40 ${refreshingLibrary ? 'opacity-50 cursor-not-allowed' : ''}`}
  aria-label={t("refreshLibrary")}
  disabled={refreshingLibrary}
>
  {refreshingLibrary ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
  ) : (
    <RefreshCw className="w-3.5 h-3.5" />
  )}
</button>
{errorRefreshing && (
  <span className="ml-2 text-xs text-red-400">Error al recargar</span>
)}

            </div>

            {loadingLibrary || !selectedSeries ? (
              <div className="flex items-center gap-2 text-surface-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">

                {/* EPUB Metadata — collapsible */}
                <div>
                  <button
                    onClick={() => setShowMetadata((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-300 transition-colors mb-2 group"
                  >
                    <FileText className="w-3.5 h-3.5 group-hover:text-primary-400 transition-colors" />
                    Metadatos EPUB
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", showMetadata && "rotate-180")} />
                  </button>
                  {showMetadata && (
                    <Card className="mb-2">
                      <CardContent className="p-4 space-y-3">
                        <MangaMetadataForm seriesSlug={seriesSlug} />
                        <div className="flex items-center gap-3 pt-2 border-t border-surface-700/40">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePatchMetadata()}
                            disabled={patching}
                            className="border-surface-600 hover:bg-surface-700 text-surface-300"
                          >
                            {patching
                              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Aplicando…</>
                              : "Aplicar a todos los EPUB"}
                          </Button>
                          {patchResult && (
                            <p className="text-xs text-surface-400">
                              {patchResult.updated}/{patchResult.total} EPUB actualizados
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Select-all row */}
                {selectedSeries.chapters.length > 0 && (
                  <div className="flex items-center gap-3 px-1">
                    <Checkbox
                      id="select-all-chapters"
                      checked={
                        selectedChapters.size === selectedSeries.chapters.length &&
                        selectedSeries.chapters.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                    <label htmlFor="select-all-chapters" className="text-xs text-surface-400 cursor-pointer select-none">
                      {selectedChapters.size === selectedSeries.chapters.length && selectedSeries.chapters.length > 0
                        ? t("deselectAll") : t("selectAll")}
                    </label>
                    {selectedChapters.size > 0 && (
                      <Badge variant="outline" className="text-[10px] border-primary-600/60 text-primary-400">
                        {t("selectedChapters", { count: selectedChapters.size })}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Chapter list */}
                {selectedSeries.chapters.length === 0 ? (
                  <p className="text-surface-400 text-sm px-1">{t("noChapters")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSeries.chapters.map((ch) => (
                      <ChapterRow
                        key={ch.slug}
                        chapter={ch}
                        seriesSlug={seriesSlug}
                        isSelected={selectedChapters.has(ch.slug)}
                        isExpanded={expandedChapters.has(ch.slug)}
                        isConverted={!!converted.get(seriesSlug)?.has(ch.slug)}
                        isExporting={!!bulk && !bulk.finished}
                        isLoading={loadingChapters.has(ch.slug)}
                        hasError={errorChapters.has(ch.slug)}
                        onToggleSelect={() => toggleChapterSelect(ch.slug)}
                        onToggleExpand={() => toggleExpand(ch.slug)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {exportBar}
    </FloatingSection>
  );
}

export default function MangaLibrary() {
  return (
    <Suspense>
      <MangaLibraryInner />
    </Suspense>
  );
}
