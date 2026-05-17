"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronRight, Loader2, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Checkbox } from "@/components/ui/primitives/checkbox";
import { ScrapeService } from "@/services/api/boffmedia/scrapeService";
import { useMangaStore } from "@/stores/useMangaStore";
import ChapterGrid from "./ChapterGrid";
import MangaMetadataForm from "../../_components/MangaMetadataForm";

// Session-only scroll memory for the library grid
let _libraryScrollY = 0;

interface BulkState {
  total: number;
  done: number;
  currentSlug: string | null;
  errors: string[];
  finished: boolean;
}

function MangaLibraryInner() {
  const t = useTranslations("boffmedia.mangaLibrary");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Store
  const library = useMangaStore((s) => s.library);
  const setLibrary = useMangaStore((s) => s.setLibrary);
  const clearLibraryCache = useMangaStore((s) => s.clearLibraryCache);
  const chapterPagesMap = useMangaStore((s) => s.chapterPages);
  const pageSelections = useMangaStore((s) => s.pageSelections);
  const togglePage = useMangaStore((s) => s.togglePage);
  const setPages = useMangaStore((s) => s.setPages);
  const seriesMetadata = useMangaStore((s) => s.seriesMetadata);

  // URL-driven state (source of truth for current view)
  const seriesSlug = searchParams.get("series");
  const chapterSlug = searchParams.get("chapter");

  // Derived from store + URL
  const selectedSeries = library?.series.find((s) => s.slug === seriesSlug) ?? null;
  const discarded = new Set<number>(chapterSlug ? (pageSelections[chapterSlug] ?? []) : []);
  const currentPages = chapterSlug ? (chapterPagesMap[chapterSlug] ?? []) : [];

  // Ephemeral state
  const [loadingLibrary, setLoadingLibrary] = useState(!library);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converted, setConverted] = useState<Map<string, Set<string>>>(new Map());
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [removeFirst, setRemoveFirst] = useState(0);
  const [removeLast, setRemoveLast] = useState(0);
  const [bulk, setBulk] = useState<BulkState | null>(null);
  const [includeCoverSingle, setIncludeCoverSingle] = useState(false);
  const [includeCoverBulk, setIncludeCoverBulk] = useState(false);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  const prevSeriesSlug = useRef<string | null>(null);

  useEffect(() => { setPortalTarget(document.body); }, []);

  // Preserve library scroll when navigating in/out
  useEffect(() => {
    const wasInLibrary = prevSeriesSlug.current === null;
    const isInLibrary = seriesSlug === null;
    if (wasInLibrary && !isInLibrary) {
      _libraryScrollY = window.scrollY;
    } else if (!wasInLibrary && isInLibrary) {
      requestAnimationFrame(() => window.scrollTo({ top: _libraryScrollY, behavior: "instant" }));
    }
    prevSeriesSlug.current = seriesSlug;
  }, [seriesSlug]);

  // Load library (use persisted cache if available; re-fetches when cache is cleared)
  useEffect(() => {
    if (library) { setLoadingLibrary(false); return; }
    setLoadingLibrary(true);
    ScrapeService.getLocalMangaLibrary().then((res) => {
      if (res.success && res.data) setLibrary(res.data);
      setLoadingLibrary(false);
    });
  }, [library, setLibrary]);

  // Load chapter pages (use persisted cache if available)
  useEffect(() => {
    if (!seriesSlug || !chapterSlug) { setLoadingPages(false); return; }
    const { chapterPages, setChapterPages } = useMangaStore.getState();
    if (chapterPages[chapterSlug]) { setLoadingPages(false); return; }
    setLoadingPages(true);
    setPagesError(null);
    ScrapeService.getChapterPageList(seriesSlug, chapterSlug)
      .then((res) => {
        setLoadingPages(false);
        if (res.success && res.data) setChapterPages(chapterSlug, res.data);
        else setPagesError(t("errorLoadingPages"));
      })
      .catch(() => { setLoadingPages(false); setPagesError(t("errorLoadingPages")); });
   
  }, [seriesSlug, chapterSlug]);

  // Reset bulk state when leaving series
  useEffect(() => {
    if (!seriesSlug) {
      setSelectedChapters(new Set());
      setBulk(null);
    }
  }, [seriesSlug]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function openSeries(slug: string) {
    router.push(`${pathname}?series=${encodeURIComponent(slug)}`, { scroll: false });
  }

  function openChapter(slug: string) {
    if (!seriesSlug) return;
    router.push(
      `${pathname}?series=${encodeURIComponent(seriesSlug)}&chapter=${encodeURIComponent(slug)}`,
      { scroll: false },
    );
  }

  function goToLibrary() {
    router.push(pathname, { scroll: false });
  }

  function goToSeries() {
    if (!seriesSlug) return;
    router.push(`${pathname}?series=${encodeURIComponent(seriesSlug)}`, { scroll: false });
  }

  // ── Single-chapter convert ──────────────────────────────────────────────────
  async function handleConvert() {
    if (!seriesSlug || !chapterSlug) return;
    setConverting(true);
    setConvertError(null);
    const res = await ScrapeService.convertMangaChapter(
      seriesSlug, chapterSlug, Array.from(discarded), includeCoverSingle,
      seriesSlug ? seriesMetadata[seriesSlug] : undefined,
    ).catch(() => null);
    setConverting(false);
    if (!res?.success) { setConvertError(t("errorConverting")); return; }
    markConverted(seriesSlug, chapterSlug);
    refreshLibrary();
  }

  // ── Multi-select helpers ────────────────────────────────────────────────────
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
    setSelectedChapters(
      selectedChapters.size === allSlugs.length ? new Set() : new Set(allSlugs),
    );
  }

  // ── Bulk convert ────────────────────────────────────────────────────────────
  async function handleBulkConvert() {
    if (!selectedSeries || selectedChapters.size === 0) return;
    const chapters = selectedSeries.chapters.filter((c) => selectedChapters.has(c.slug));
    setBulk({ total: chapters.length, done: 0, currentSlug: null, errors: [], finished: false });

    for (const ch of chapters) {
      setBulk((prev) => prev ? { ...prev, currentSlug: ch.slug } : prev);
      const excludePages = buildExcludePages(ch.imageCount, removeFirst, removeLast);
      const res = await ScrapeService.convertMangaChapter(
        selectedSeries.slug, ch.slug, excludePages, includeCoverBulk,
        seriesMetadata[selectedSeries.slug],
      ).catch(() => null);
      if (res?.success) markConverted(selectedSeries.slug, ch.slug);
      setBulk((prev) => prev
        ? { ...prev, done: prev.done + 1, errors: res?.success ? prev.errors : [...prev.errors, ch.slug] }
        : prev,
      );
    }
    setBulk((prev) => prev ? { ...prev, currentSlug: null, finished: true } : prev);
    refreshLibrary();
  }

  function buildExcludePages(imageCount: number, first: number, last: number): number[] {
    const excluded = new Set<number>();
    for (let i = 0; i < Math.min(first, imageCount); i++) excluded.add(i);
    for (let i = Math.max(0, imageCount - last); i < imageCount; i++) excluded.add(i);
    return Array.from(excluded);
  }

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

  // ── Floating bars ───────────────────────────────────────────────────────────
  // Mutual exclusion: bulk bar takes priority when chapters are selected
  const showBulkBar = seriesSlug && selectedChapters.size > 0;
  const showSingleBar = chapterSlug && currentPages.length > 0 && !showBulkBar;
  const isConverted = !!(seriesSlug && chapterSlug && converted.get(seriesSlug)?.has(chapterSlug));

  const singleBar = showSingleBar && portalTarget
    ? createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
          <div className="pointer-events-auto mb-6 flex items-center gap-3 bg-surface-800/95 backdrop-blur-sm border border-surface-700/60 rounded-xl px-5 py-3 shadow-2xl">
            {discarded.size > 0 && (
              <>
                <span className="text-sm text-red-400">{t("discardedCount", { count: discarded.size })}</span>
                <button
                  onClick={() => setPages(chapterSlug!, [])}
                  className="text-surface-400 hover:text-surface-200 transition-colors"
                  aria-label={t("clearDiscarded")}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-surface-600" />
              </>
            )}
            {convertError && <span className="text-sm text-red-400">{convertError}</span>}
            {isConverted && !converting && <span className="text-sm text-green-400">{t("converted")}</span>}
            <label className="flex items-center gap-1.5 text-sm text-surface-400 cursor-pointer select-none shrink-0">
              <Checkbox checked={includeCoverSingle} onCheckedChange={(v) => setIncludeCoverSingle(!!v)} />
              {t("coverPage")}
            </label>
            <p className="text-xs text-surface-500">{t("keepNote")}</p>
            <Button onClick={handleConvert} disabled={converting} size="sm">
              {converting
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />{t("converting")}</>
                : t("convertToEpub")}
            </Button>
          </div>
        </div>,
        portalTarget,
      )
    : null;

  const bulkBar = showBulkBar && portalTarget
    ? createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
          <div className="pointer-events-auto mb-6 flex flex-wrap items-center gap-3 bg-surface-800/95 backdrop-blur-sm border border-surface-700/60 rounded-xl px-5 py-3 shadow-2xl max-w-2xl">
            <span className="text-sm font-medium text-surface-200 shrink-0">
              {t("selectedChapters", { count: selectedChapters.size })}
            </span>
            <div className="w-px h-4 bg-surface-600 shrink-0" />
            <label className="flex items-center gap-1.5 text-sm text-surface-400 shrink-0">
              {t("removeFirst")}
              <input
                type="number" min={0} max={99} value={removeFirst}
                onChange={(e) => setRemoveFirst(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 rounded bg-surface-700 border border-surface-600 text-surface-100 text-center text-sm px-1 py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-surface-400 shrink-0">
              {t("removeLast")}
              <input
                type="number" min={0} max={99} value={removeLast}
                onChange={(e) => setRemoveLast(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 rounded bg-surface-700 border border-surface-600 text-surface-100 text-center text-sm px-1 py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
            {bulk && !bulk.finished && (
              <span className="text-sm text-surface-400 shrink-0">
                {t("bulkConverting", { done: bulk.done, total: bulk.total })}
              </span>
            )}
            {bulk?.finished && (
              <span className="text-sm text-green-400 shrink-0">
                {t("bulkDone", { count: bulk.done - bulk.errors.length })}
                {bulk.errors.length > 0 && <span className="text-red-400 ml-1">({bulk.errors.length} errors)</span>}
              </span>
            )}
            <label className="flex items-center gap-1.5 text-sm text-surface-400 cursor-pointer select-none shrink-0">
              <Checkbox checked={includeCoverBulk} onCheckedChange={(v) => setIncludeCoverBulk(!!v)} />
              {t("coverPage")}
            </label>
            <p className="text-xs text-surface-500 shrink-0">{t("keepNote")}</p>
            <Button
              onClick={handleBulkConvert}
              disabled={!!bulk && !bulk.finished}
              size="sm"
              className="shrink-0"
            >
              {bulk && !bulk.finished
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />{t("converting")}</>
                : t("convertSelected")}
            </Button>
          </div>
        </div>,
        portalTarget,
      )
    : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8 flex items-center gap-3"
      >
        <BookOpen className="w-7 h-7 text-primary-400 shrink-0" />
        <h1 className="text-3xl font-bold tracking-tight flex-1">
          <span className="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
            {t("title")}
          </span>
        </h1>
        <button
          onClick={clearLibraryCache}
          className="text-surface-500 hover:text-surface-200 transition-colors p-1.5 rounded hover:bg-surface-700/40"
          aria-label={t("refreshLibrary")}
          title={t("refreshLibrary")}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Breadcrumb */}
      {seriesSlug && (
        <div className="flex items-center gap-1.5 text-sm text-surface-400 mb-6 flex-wrap">
          <button onClick={goToLibrary} className="hover:text-surface-100 transition-colors">
            {t("backToLibrary")}
          </button>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <button
            onClick={chapterSlug ? goToSeries : undefined}
            className={`hover:text-surface-100 transition-colors ${!chapterSlug ? "text-surface-100 font-medium pointer-events-none" : ""}`}
          >
            {seriesSlug}
          </button>
          {chapterSlug && (
            <>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-surface-100 font-medium">{chapterSlug}</span>
            </>
          )}
        </div>
      )}

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
                      <CardContent className="pt-0">
                        <span className="text-sm text-surface-400">{series.chapters.length} {t("chapters")}</span>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SERIES + CHAPTER TWO-PANEL VIEW ── */}
        {seriesSlug && (
          <motion.div
            key="series"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {loadingLibrary || !selectedSeries ? (
              <div className="flex items-center gap-2 text-surface-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4 pb-24">

                {/* LEFT PANEL: Chapter list */}
                <div className="lg:w-72 xl:w-80 shrink-0 lg:self-start lg:sticky lg:top-4">
                  <Card className="flex flex-col lg:max-h-[calc(100vh-5rem)]">
                    <CardContent className="p-0 flex flex-col min-h-0">

                      {selectedSeries.chapters.length > 0 && (
                        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-700/50 shrink-0">
                          <Checkbox
                            id="select-all"
                            checked={
                              selectedChapters.size === selectedSeries.chapters.length &&
                              selectedSeries.chapters.length > 0
                            }
                            onCheckedChange={toggleSelectAll}
                          />
                          <label htmlFor="select-all" className="text-xs text-surface-400 cursor-pointer select-none">
                            {selectedChapters.size === selectedSeries.chapters.length &&
                            selectedSeries.chapters.length > 0
                              ? t("deselectAll")
                              : t("selectAll")}
                          </label>
                          {selectedChapters.size > 0 && (
                            <Badge variant="outline" className="ml-auto text-[10px] border-primary-600/60 text-primary-400">
                              {t("selectedChapters", { count: selectedChapters.size })}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="overflow-y-auto">
                        {selectedSeries.chapters.length === 0 ? (
                          <p className="p-6 text-surface-400 text-sm">{t("noChapters")}</p>
                        ) : (
                          <ul className="divide-y divide-surface-700/50">
                            {selectedSeries.chapters.map((ch) => {
                              const hasEpub = ch.hasEpub || converted.get(selectedSeries.slug)?.has(ch.slug);
                              const isSelected = selectedChapters.has(ch.slug);
                              const isActive = ch.slug === chapterSlug;
                              return (
                                <li
                                  key={ch.slug}
                                  className={`flex items-center transition-colors ${isSelected ? "bg-primary-900/20" : ""} ${isActive ? "border-l-2 border-primary-500 bg-primary-900/30" : ""}`}
                                >
                                  <div className="pl-4 pr-2 py-3 flex items-center shrink-0">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleChapterSelect(ch.slug)}
                                      aria-label={`Select chapter ${ch.slug}`}
                                    />
                                  </div>
                                  <button
                                    onClick={() => openChapter(ch.slug)}
                                    className="flex-1 flex items-center gap-2 px-3 py-3 hover:bg-surface-700/30 transition-colors text-left min-w-0"
                                  >
                                    <span className={`flex-1 font-medium text-sm truncate ${isActive ? "text-primary-300" : ""}`}>
                                      {ch.slug}
                                    </span>
                                    <div className="flex gap-1 shrink-0">
                                      {ch.hasCbz && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-surface-600 text-surface-400">{t("cbz")}</Badge>
                                      )}
                                      {hasEpub && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary-600/60 text-primary-400">{t("epub")}</Badge>
                                      )}
                                    </div>
                                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary-400" : "text-surface-500"}`} />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT PANEL: Page grid or metadata form */}
                <div className="flex-1 min-w-0">
                  {!chapterSlug ? (
                    <Card>
                      <CardContent className="p-5">
                        <MangaMetadataForm seriesSlug={seriesSlug} />
                        <p className="mt-4 text-xs text-surface-500 text-center">{t("selectChapter")}</p>
                      </CardContent>
                    </Card>
                  ) : loadingPages ? (
                    <div className="flex items-center gap-2 text-surface-400 py-8">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{t("loadingPages")}</span>
                    </div>
                  ) : pagesError ? (
                    <Card>
                      <CardContent className="py-8 text-center text-red-400 text-sm">{pagesError}</CardContent>
                    </Card>
                  ) : (
                    <ChapterGrid
                      series={seriesSlug}
                      chapter={chapterSlug}
                      pages={currentPages}
                      discarded={discarded}
                      onToggle={(i) => togglePage(chapterSlug, i)}
                    />
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {singleBar}
      {bulkBar}
    </div>
  );
}

export default function MangaLibrary() {
  return (
    <Suspense>
      <MangaLibraryInner />
    </Suspense>
  );
}
