"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronRight, Loader2, X } from "lucide-react";
import {
  ChapterPageInfo,
  LocalMangaChapter,
  LocalMangaLibrary,
  LocalMangaSeries,
  ScrapeService,
} from "@/services/api/boffmedia/scrapeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import ChapterGrid from "./ChapterGrid";

type View = "library" | "series" | "chapter";

export default function MangaLibrary() {
  const t = useTranslations("boffmedia.mangaLibrary");

  // ── Data ─────────────────────────────────────────────────────────────────
  const [library, setLibrary] = useState<LocalMangaLibrary | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  // ── Navigation state ─────────────────────────────────────────────────────
  const [view, setView] = useState<View>("library");
  const [selectedSeries, setSelectedSeries] = useState<LocalMangaSeries | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<LocalMangaChapter | null>(null);

  // ── Chapter pages ─────────────────────────────────────────────────────────
  const [pages, setPages] = useState<ChapterPageInfo[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);

  // ── Discard + convert ─────────────────────────────────────────────────────
  const [discarded, setDiscarded] = useState<Set<number>>(new Set());
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  // Track which chapter slugs have been converted this session (series→Set<slug>)
  const [converted, setConverted] = useState<Map<string, Set<string>>>(new Map());

  // Portal for sticky bar
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  useEffect(() => { setPortalTarget(document.body); }, []);

  // ── Load library ─────────────────────────────────────────────────────────
  useEffect(() => {
    ScrapeService.getLocalMangaLibrary().then((res) => {
      if (res.success && res.data) setLibrary(res.data);
      setLoadingLibrary(false);
    });
  }, []);

  // ── Load pages when chapter opens ─────────────────────────────────────────
  useEffect(() => {
    if (view !== "chapter" || !selectedSeries || !selectedChapter) return;
    setPages([]);
    setDiscarded(new Set());
    setConvertError(null);
    setLoadingPages(true);
    setPagesError(null);

    ScrapeService.getChapterPageList(selectedSeries.slug, selectedChapter.slug).then((res) => {
      setLoadingPages(false);
      if (res.success && res.data) {
        setPages(res.data);
      } else {
        setPagesError(t("errorLoadingPages"));
      }
    }).catch(() => {
      setLoadingPages(false);
      setPagesError(t("errorLoadingPages"));
    });
  }, [view, selectedSeries, selectedChapter, t]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openSeries(series: LocalMangaSeries) {
    setSelectedSeries(series);
    setSelectedChapter(null);
    setView("series");
  }

  function openChapter(chapter: LocalMangaChapter) {
    setSelectedChapter(chapter);
    setView("chapter");
  }

  function toggleDiscard(index: number) {
    setDiscarded((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  async function handleConvert() {
    if (!selectedSeries || !selectedChapter) return;
    setConverting(true);
    setConvertError(null);

    const res = await ScrapeService.convertMangaChapter(
      selectedSeries.slug,
      selectedChapter.slug,
      Array.from(discarded),
    ).catch(() => null);

    setConverting(false);

    if (!res?.success) {
      setConvertError(t("errorConverting"));
      return;
    }

    // Mark chapter as converted and refresh library so EPUB badge appears
    setConverted((prev) => {
      const next = new Map(prev);
      const slugs = new Set(next.get(selectedSeries.slug) ?? []);
      slugs.add(selectedChapter.slug);
      next.set(selectedSeries.slug, slugs);
      return next;
    });

    ScrapeService.getLocalMangaLibrary().then((r) => {
      if (r.success && r.data) setLibrary(r.data);
    });
  }

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  const breadcrumb = (
    <div className="flex items-center gap-1.5 text-sm text-surface-400 mb-6 flex-wrap">
      <button
        onClick={() => setView("library")}
        className={`hover:text-surface-100 transition-colors ${view === "library" ? "text-surface-100 font-medium pointer-events-none" : ""}`}
      >
        {t("backToLibrary")}
      </button>
      {selectedSeries && (
        <>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <button
            onClick={() => setView("series")}
            className={`hover:text-surface-100 transition-colors ${view === "series" ? "text-surface-100 font-medium pointer-events-none" : ""}`}
          >
            {selectedSeries.slug}
          </button>
        </>
      )}
      {selectedChapter && view === "chapter" && (
        <>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-surface-100 font-medium">{selectedChapter.slug}</span>
        </>
      )}
    </div>
  );

  // ── Sticky convert bar ────────────────────────────────────────────────────
  const isConverted = !!(
    selectedSeries &&
    selectedChapter &&
    converted.get(selectedSeries.slug)?.has(selectedChapter.slug)
  );

  const stickyBar = view === "chapter" && pages.length > 0 && portalTarget
    ? createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
          <div className="pointer-events-auto mb-6 flex items-center gap-3 bg-surface-800/95 backdrop-blur-sm border border-surface-700/60 rounded-xl px-5 py-3 shadow-2xl">
            {discarded.size > 0 && (
              <>
                <span className="text-sm text-red-400">
                  {t("discardedCount", { count: discarded.size })}
                </span>
                <button
                  onClick={() => setDiscarded(new Set())}
                  className="text-surface-400 hover:text-surface-200 transition-colors"
                  aria-label={t("clearDiscarded")}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-surface-600" />
              </>
            )}
            {convertError && (
              <span className="text-sm text-red-400">{convertError}</span>
            )}
            {isConverted && !converting && (
              <span className="text-sm text-green-400">{t("converted")}</span>
            )}
            <p className="text-xs text-surface-500">{t("keepNote")}</p>
            <Button
              onClick={handleConvert}
              disabled={converting || pages.length === 0}
              size="sm"
            >
              {converting ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />{t("converting")}</>
              ) : (
                t("convertToEpub")
              )}
            </Button>
          </div>
        </div>,
        portalTarget,
      )
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-primary-400" />
          <span className="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
            {t("title")}
          </span>
        </h1>
      </motion.div>

      {view !== "library" && breadcrumb}

      <AnimatePresence mode="wait">
        {/* ── LIBRARY VIEW ── */}
        {view === "library" && (
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
                <span className="text-sm">…</span>
              </div>
            ) : !library?.series.length ? (
              <Card>
                <CardContent className="py-12 text-center text-surface-400">
                  {t("noSeries")}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {library.series.map((series) => (
                  <button
                    key={series.slug}
                    onClick={() => openSeries(series)}
                    className="text-left"
                  >
                    <Card className="hover:border-primary-500/50 transition-colors cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base leading-snug line-clamp-2">
                          {series.slug}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <span className="text-sm text-surface-400">
                          {series.chapters.length} {t("chapters")}
                        </span>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SERIES VIEW ── */}
        {view === "series" && selectedSeries && (
          <motion.div
            key="series"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-0">
                {selectedSeries.chapters.length === 0 ? (
                  <p className="p-6 text-surface-400 text-sm">{t("noChapters")}</p>
                ) : (
                  <ul className="divide-y divide-surface-700/50">
                    {selectedSeries.chapters.map((ch) => {
                      const wasConverted = converted.get(selectedSeries.slug)?.has(ch.slug);
                      const hasEpub = ch.hasEpub || wasConverted;
                      return (
                        <li key={ch.slug}>
                          <button
                            onClick={() => openChapter(ch)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-700/30 transition-colors text-left"
                          >
                            <span className="flex-1 font-medium text-sm">{ch.slug}</span>
                            <span className="text-xs text-surface-500 shrink-0">
                              {ch.imageCount} {t("pages")}
                            </span>
                            <div className="flex gap-1.5 shrink-0">
                              {ch.hasCbz && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-surface-600 text-surface-400">
                                  {t("cbz")}
                                </Badge>
                              )}
                              {hasEpub && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary-600/60 text-primary-400">
                                  {t("epub")}
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-surface-500 shrink-0" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── CHAPTER VIEW ── */}
        {view === "chapter" && selectedSeries && selectedChapter && (
          <motion.div
            key="chapter"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            {loadingPages ? (
              <div className="flex items-center gap-2 text-surface-400 py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t("loadingPages")}</span>
              </div>
            ) : pagesError ? (
              <Card>
                <CardContent className="py-8 text-center text-red-400 text-sm">
                  {pagesError}
                </CardContent>
              </Card>
            ) : (
              <ChapterGrid
                series={selectedSeries.slug}
                chapter={selectedChapter.slug}
                pages={pages}
                discarded={discarded}
                onToggle={toggleDiscard}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {stickyBar}
    </div>
  );
}
