"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Icon, Spinner, Checkbox, Empty } from "@boffmedia/ui";
import { cn } from "@/lib/utils";
import { ScrapeService } from "@/services/api/boffmedia/scrapeService";
import { useMangaStore } from "@/stores/useMangaStore";
import { AvSectionHead, AvPanel, AvPill } from "../ui/av-kit";
import { MgCard, MgFormatTag } from "./ui/mg-kit";
import MangaMetadataForm from "./MangaMetadataForm";

// Session-only scroll memory for the library grid
let _libraryScrollY = 0;

interface BulkState {
  total: number;
  done: number;
  currentSlug: string | null;
  errors: string[];
  finished: boolean;
}

interface ChapterDef {
  slug: string;
  hasCbz: boolean;
  hasEpub: boolean;
  imageCount: number;
}

/* ---- chapter row with expandable page picker ------------------------------ */

function ChapterRow({
  chapter, seriesSlug, isSelected, isExpanded, isConverted, isExporting, isLoading, hasError,
  onToggleSelect, onToggleExpand,
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
  const t = useTranslations("admin.manga.library");

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
      "border border-solid transition-colors",
      isSelected ? "border-accent-line bg-accent-soft" : "border-line bg-base-2 hover:border-line-2",
    )}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Checkbox checked={isSelected} onChange={onToggleSelect} disabled={isExporting} />
        <button onClick={onToggleExpand} className="group flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={isExpanded}>
          <Icon name="code" size={13} className={cn("shrink-0 transition-colors", isSelected ? "text-accent" : "text-txt-dim group-hover:text-txt")} />
          <span className={cn("flex-1 truncate text-[14px] font-medium transition-colors", isSelected ? "text-accent" : "text-txt")}>
            {chapter.slug}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="font-mono text-[10px] tabular-nums text-txt-dim">
            {isExpanded && chapterPages.length > 0 ? `${includedCount}/${totalPages}` : t("pagesN", { n: totalPages })}
          </span>
          {chapter.hasCbz && <MgFormatTag kind="cbz" />}
          {hasEpub && <MgFormatTag kind="epub" />}
          <button onClick={onToggleExpand} tabIndex={-1} aria-hidden className="text-txt-dim transition-colors hover:text-txt">
            <Icon name="chevronDown" size={14} className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-2.5 border-t border-solid border-line px-3 py-3">
          {isLoading ? (
            <div className="flex items-center gap-2 py-1 text-[12px] text-txt-muted">
              <Spinner size={14} className="text-accent" />{t("loadingPages")}
            </div>
          ) : hasError ? (
            <p className="py-1 text-[12px] text-bad">{t("pagesError")}</p>
          ) : chapterPages.length === 0 ? (
            <p className="py-1 text-[12px] text-txt-dim">{t("noPages")}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={keepAll} className="border border-solid border-line px-2 py-0.5 text-[11px] text-txt-muted transition-colors hover:border-line-2 hover:text-txt">{t("includeAll")}</button>
                <button onClick={excludeAll} className="border border-solid border-line px-2 py-0.5 text-[11px] text-txt-muted transition-colors hover:border-line-2 hover:text-txt">{t("excludeAll")}</button>
                <button onClick={invertSelection} className="border border-solid border-line px-2 py-0.5 text-[11px] text-txt-muted transition-colors hover:border-line-2 hover:text-txt">{t("invert")}</button>
                {excludedSet.size > 0 && <span className="ml-auto text-[11px] text-bad">{t("excludedN", { n: excludedSet.size })}</span>}
              </div>
              <div role="group" className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10">
                {chapterPages.map((page) => {
                  const excluded = excludedSet.has(page.index);
                  return (
                    <button
                      key={page.index}
                      type="button"
                      onClick={() => togglePage(chapter.slug, page.index)}
                      className="relative aspect-[2/3] overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                      aria-pressed={excluded}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ScrapeService.getChapterImageUrl(seriesSlug, chapter.slug, page.index)} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 py-px text-center text-[7px] leading-none text-white">{page.index + 1}</span>
                      {excluded ? (
                        <div className="absolute inset-0 grid place-items-center bg-bad/80"><Icon name="eye" size={11} className="text-white" /></div>
                      ) : (
                        <div className="absolute inset-0 transition-colors hover:bg-white/10" />
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

/* ---- main ------------------------------------------------------------------ */

function MangaLibraryInner() {
  const t = useTranslations("admin.manga.library");
  const [refreshingLibrary, setRefreshingLibrary] = useState(false);
  const [errorRefreshing, setErrorRefreshing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const library = useMangaStore((s) => s.library);
  const setLibrary = useMangaStore((s) => s.setLibrary);
  const clearSelectionsForSeries = useMangaStore((s) => s.clearSelectionsForSeries);
  const clearChapterPagesForSeries = useMangaStore((s) => s.clearChapterPagesForSeries);
  const chapterPagesMap = useMangaStore((s) => s.chapterPages);
  const pageSelections = useMangaStore((s) => s.pageSelections);
  const seriesMetadata = useMangaStore((s) => s.seriesMetadata);

  const seriesSlug = searchParams.get("series");
  const selectedSeries = library?.series.find((s) => s.slug === seriesSlug) ?? null;

  const [loadingLibrary, setLoadingLibrary] = useState(!library);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loadingChapters, setLoadingChapters] = useState<Set<string>>(new Set());
  const [errorChapters, setErrorChapters] = useState<Set<string>>(new Set());
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    if (prevSeriesRef.current !== seriesSlug) {
      setExpandedChapters(new Set());
      setSelectedChapters(new Set());
      setBulk(null);
    }
  }, [seriesSlug]);

  useEffect(() => {
    const wasInLibrary = prevSeriesRef.current === null;
    const isInLibrary = seriesSlug === null;
    if (wasInLibrary && !isInLibrary) _libraryScrollY = window.scrollY;
    else if (!wasInLibrary && isInLibrary)
      requestAnimationFrame(() => window.scrollTo({ top: _libraryScrollY, behavior: "instant" }));
    prevSeriesRef.current = seriesSlug;
  }, [seriesSlug]);

  useEffect(() => {
    if (library) { setLoadingLibrary(false); return; }
    setLoadingLibrary(true);
    ScrapeService.getLocalMangaLibrary().then((res) => {
      if (res.success && res.data) setLibrary(res.data);
      setLoadingLibrary(false);
    });
  }, [library, setLibrary]);

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

  async function toggleExpand(chapterSlug: string) {
    const isExpanded = expandedChapters.has(chapterSlug);
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      isExpanded ? next.delete(chapterSlug) : next.add(chapterSlug);
      return next;
    });
    if (!isExpanded && !chapterPagesMap[chapterSlug]) {
      setLoadingChapters((prev) => new Set([...prev, chapterSlug]));
      setErrorChapters((prev) => { const next = new Set(prev); next.delete(chapterSlug); return next; });
      const res = await ScrapeService.getChapterPageList(seriesSlug!, chapterSlug);
      setLoadingChapters((prev) => { const next = new Set(prev); next.delete(chapterSlug); return next; });
      if (res.success && res.data) useMangaStore.getState().setChapterPages(chapterSlug, res.data);
      else setErrorChapters((prev) => new Set([...prev, chapterSlug]));
    }
  }

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
    if (res?.success && res.data) setPatchResult({ updated: res.data.updated, total: res.data.results.length });
    setPatching(false);
  }

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

  const allEpubOnly = selectedSeries !== null && selectedChapters.size > 0 &&
    [...selectedChapters].every((slug) => {
      const ch = selectedSeries.chapters.find((c) => c.slug === slug);
      return ch && ch.hasEpub && !ch.hasCbz && !converted.get(selectedSeries.slug)?.has(slug);
    });

  const doRefresh = async (clearSeries?: string) => {
    setRefreshingLibrary(true);
    setErrorRefreshing(false);
    try {
      const res = await ScrapeService.getLocalMangaLibrary();
      if (res.success && res.data) {
        setLibrary(res.data);
        if (clearSeries) {
          clearSelectionsForSeries(clearSeries);
          clearChapterPagesForSeries(clearSeries);
        }
      } else setErrorRefreshing(true);
    } catch {
      setErrorRefreshing(true);
    } finally {
      setRefreshingLibrary(false);
    }
  };

  const exportBar = exportSummary && portalTarget
    ? createPortal(
        <div className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center px-4 pb-5">
          <div className="w-full max-w-2xl overflow-hidden border border-solid border-line-2 bg-[color-mix(in_srgb,var(--panel)_97%,transparent)] shadow-[0_18px_48px_rgba(0,0,0,0.5)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-txt">{t("selectedN", { count: exportSummary.count })}</p>
                <p className="font-mono text-[11px] text-txt-muted">
                  {exportSummary.totalIncluded < exportSummary.totalPages
                    ? t("includedOfN", { included: exportSummary.totalIncluded, total: exportSummary.totalPages })
                    : t("includedN", { n: exportSummary.totalIncluded })}
                </p>
              </div>

              {bulk && !bulk.finished && (
                <div className="flex shrink-0 flex-col items-end">
                  <span className="font-mono text-[11px] text-txt-muted">{bulk.done}/{bulk.total}</span>
                  {bulk.currentSlug && <span className="max-w-[8rem] truncate text-[10px] text-txt-dim">{bulk.currentSlug}</span>}
                </div>
              )}
              {bulk?.finished && (
                <span className="shrink-0"><AvPill tone={bulk.errors.length ? "amber" : "green"} icon="check">
                  {t("okN", { n: bulk.done - bulk.errors.length })}{bulk.errors.length > 0 ? ` · ${t("errN", { n: bulk.errors.length })}` : ""}
                </AvPill></span>
              )}

              <Checkbox checked={includeCover} onChange={setIncludeCover} label={t("cover")} />
              <button onClick={() => setShowAdvanced((v) => !v)} className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-txt-dim transition-colors hover:text-txt">
                {showAdvanced ? t("basic") : t("advanced")}
              </button>

              {(() => {
                const convertedSet = converted.get(selectedSeries?.slug ?? "") ?? new Set<string>();
                const epubSlugs = (selectedSeries?.chapters ?? [])
                  .filter((c) => selectedChapters.has(c.slug) && (c.hasEpub || convertedSet.has(c.slug)))
                  .map((c) => c.slug);
                return epubSlugs.length > 0 ? (
                  <Button size="sm" onClick={() => handlePatchMetadata(epubSlugs)} loading={patching} disabled={patching || (!!bulk && !bulk.finished)}>
                    {patching ? t("updatingMetadata") : t("updateMetadata")}
                  </Button>
                ) : null;
              })()}

              <Button variant="pri" size="sm" icon="code" onClick={handleBulkExport} loading={!!bulk && !bulk.finished} disabled={!!bulk && !bulk.finished}>
                {bulk && !bulk.finished ? t("processing") : allEpubOnly ? t("updateEpub") : t("exportSelected")}
              </Button>
            </div>

            {showAdvanced && (
              <div className="flex flex-wrap items-center gap-4 border-t border-solid border-line px-5 py-2.5">
                <span className="shrink-0 text-[11px] text-txt-dim">{t("patternNote")}</span>
                <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-txt-muted">
                  {t("removeFirst")}
                  <input type="number" min={0} max={99} value={removeFirst} onChange={(e) => setRemoveFirst(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 border border-solid border-line-2 bg-base-2 px-1 py-0.5 text-center text-[12px] text-txt [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                </label>
                <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-txt-muted">
                  {t("removeLast")}
                  <input type="number" min={0} max={99} value={removeLast} onChange={(e) => setRemoveLast(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 border border-solid border-line-2 bg-base-2 px-1 py-0.5 text-center text-[12px] text-txt [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                </label>
              </div>
            )}
          </div>
        </div>,
        portalTarget,
      )
    : null;

  return (
    <div className="pb-32">
      {/* ── LIBRARY VIEW ── */}
      {!seriesSlug && (
        <>
          <AvSectionHead
            title={t("title")}
            actions={
              <div className="flex items-center gap-2">
                {errorRefreshing && <span className="text-[11px] text-bad">{t("refreshError")}</span>}
                <Button variant="ghost" icon="refresh" onClick={() => doRefresh()} loading={refreshingLibrary} disabled={refreshingLibrary}>
                  {t("refresh")}
                </Button>
              </div>
            }
          />
          {loadingLibrary ? (
            <div className="py-8"><Spinner size={18} className="text-accent" /></div>
          ) : !library?.series.length ? (
            <Empty icon="book" title={t("noSeries")} />
          ) : (
            <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
              {library.series.map((series) => (
                <MgCard
                  key={series.slug}
                  title={series.slug}
                  meta={t("chaptersN", { count: series.chapters.length })}
                  onClick={() => openSeries(series.slug)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SERIES VIEW ── */}
      {seriesSlug && (
        <>
          <div className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-txt-muted">
            <button onClick={goToLibrary} className="flex items-center gap-1.5 transition-colors hover:text-txt">
              <Icon name="collapse" size={13} />{t("backToLibrary")}
            </button>
            <Icon name="chevronRight" size={12} className="text-txt-dim" />
            <span className="min-w-0 flex-1 truncate normal-case tracking-normal text-txt">{seriesSlug}</span>
            <button onClick={() => doRefresh(seriesSlug)} aria-label={t("refresh")} disabled={refreshingLibrary} className="text-txt-dim transition-colors hover:text-txt disabled:opacity-50">
              {refreshingLibrary ? <Spinner size={13} /> : <Icon name="refresh" size={13} />}
            </button>
          </div>

          {loadingLibrary || !selectedSeries ? (
            <div className="py-8"><Spinner size={18} className="text-accent" /></div>
          ) : (
            <div className="flex flex-col gap-4">
              <AvPanel title={t("metadata")} icon="edit">
                <MangaMetadataForm seriesSlug={seriesSlug} />
                <div className="mt-3 flex items-center gap-3 border-t border-solid border-line pt-3">
                  <Button variant="ghost" onClick={() => handlePatchMetadata()} loading={patching} disabled={patching}>
                    {patching ? t("applying") : t("applyAllEpub")}
                  </Button>
                  {patchResult && <p className="text-[12px] text-txt-muted">{t("epubUpdatedN", { updated: patchResult.updated, total: patchResult.total })}</p>}
                </div>
              </AvPanel>

              {selectedSeries.chapters.length > 0 && (
                <div className="flex items-center gap-3 px-1">
                  <Checkbox
                    checked={selectedChapters.size === selectedSeries.chapters.length && selectedSeries.chapters.length > 0}
                    onChange={toggleSelectAll}
                    label={selectedChapters.size === selectedSeries.chapters.length && selectedSeries.chapters.length > 0 ? t("deselectAll") : t("selectAll")}
                  />
                  {selectedChapters.size > 0 && <AvPill tone="accent">{t("selectedN", { count: selectedChapters.size })}</AvPill>}
                </div>
              )}

              {selectedSeries.chapters.length === 0 ? (
                <p className="px-1 text-[13px] text-txt-muted">{t("noChapters")}</p>
              ) : (
                <div className="flex flex-col gap-1.5">
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
        </>
      )}

      {exportBar}
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
