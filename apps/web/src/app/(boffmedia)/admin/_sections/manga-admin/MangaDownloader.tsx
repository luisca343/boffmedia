"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Button, Field, Input, Icon, Spinner, Toggle, Disclosure, Checkbox, SearchInput,
} from "@boffmedia/ui";
import {
  ScrapeService,
  type BrowserConfig,
  type MangaSearchResult,
  type MangaChapter,
  type MangaDownloadSseEvent,
  type LocalMangaLibrary,
} from "@/services/api/boffmedia/scrapeService";
import { useMangaStore } from "@/stores/useMangaStore";
import { AvSectionHead, AvPanel, AvPill, AvAlert, AvLiveDot, AvProgressBar, AvStickyBar } from "../../_components/ui/av-kit";
import { MgResult } from "./ui/mg-kit";
import MangaMetadataForm from "./MangaMetadataForm";

const SCRAPER_SOURCES = [
  { name: "NovelCool", url: "https://es.novelcool.com", active: true, descKey: "sourceNovelcoolDesc" },
  { name: "PkProject", url: "https://pkproject.net", active: true, descKey: "sourcePkprojectDesc" },
] as const;

/* ---- scraper sources + tunnel --------------------------------------------- */

function ScraperSourcesPanel() {
  const t = useTranslations("admin.manga.downloader");
  const [browserConfig, setBrowserConfig] = useState<BrowserConfig | null>(null);
  const [tunnelToggling, setTunnelToggling] = useState(false);

  useEffect(() => {
    ScrapeService.getBrowserConfig().then((res) => {
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
    <AvPanel title={t("sources")} icon="globe">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {SCRAPER_SOURCES.map((source) => (
            <div key={source.name} className="flex items-center gap-2 border border-solid border-line bg-base-2 px-3 py-1.5 text-[0.75rem]">
              <AvLiveDot className={source.active ? "" : "bg-txt-dim"} />
              <span className="font-medium text-txt">{source.name}</span>
              <span className="text-txt-dim">{t(source.descKey)}</span>
              <AvPill tone={source.active ? "green" : "default"}>
                {source.active ? t("sourceActive") : t("sourceInactive")}
              </AvPill>
            </div>
          ))}
        </div>
        {browserConfig && (
          <div className="flex items-center justify-between gap-4 border-t border-solid border-line pt-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.8125rem] font-medium text-txt">{t("tunnel")}</span>
              <span className="text-[0.6875rem] text-txt-dim">{t("tunnelDesc")}</span>
            </div>
            <Toggle
              on={browserConfig.tunnelEnabled}
              onChange={handleTunnelToggle}
              ariaLabel={t("tunnel")}
            />
          </div>
        )}
      </div>
    </AvPanel>
  );
}

/* ---- chapter selector ----------------------------------------------------- */

function ChapterSelector({ chapters, selected, downloadedSlugs, onToggle, onToggleAll, onSelectRange }: {
  chapters: MangaChapter[];
  selected: Set<number>;
  downloadedSlugs: Set<string>;
  onToggle: (idx: number) => void;
  onToggleAll: () => void;
  onSelectRange: (from: number, to: number) => void;
}) {
  const t = useTranslations("admin.manga.downloader");
  const allSelected = chapters.length > 0 && chapters.every((_, i) => selected.has(i));
  const [search, setSearch] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const filtered = chapters.map((ch, i) => ({ ch, i }))
    .filter(({ ch }) => !search || ch.title.toLowerCase().includes(search.toLowerCase()));

  const applyRange = () => {
    const from = Math.max(1, parseInt(rangeFrom) || 1);
    const to = Math.min(chapters.length, parseInt(rangeTo) || chapters.length);
    if (from <= to) onSelectRange(from - 1, to - 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder={t("filterChapters")} size="sm" />
        </div>
        <button onClick={onToggleAll} className="whitespace-nowrap font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-txt-muted transition-colors hover:text-txt">
          {allSelected ? t("deselect") : t("selectAllN", { n: chapters.length })}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">{t("range")}</span>
        <input
          type="number" min={1} max={chapters.length} placeholder="1"
          value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyRange()}
          className="h-7 w-20 border border-solid border-line-2 bg-base-2 px-2 text-center text-[0.75rem] text-txt [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-txt-dim">—</span>
        <input
          type="number" min={1} max={chapters.length} placeholder={String(chapters.length)}
          value={rangeTo} onChange={(e) => setRangeTo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyRange()}
          className="h-7 w-20 border border-solid border-line-2 bg-base-2 px-2 text-center text-[0.75rem] text-txt [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button size="sm" icon="check" onClick={applyRange}>{t("select")}</Button>
      </div>

      <div className="max-h-80 overflow-y-auto border border-solid border-line">
        {filtered.map(({ ch, i }) => {
          const isSelected = selected.has(i);
          const chapterKey = ch.number != null ? String(ch.number) : ch.title.replace(/[\\/:*?"<>|]/g, "").trim();
          const isDownloaded = downloadedSlugs.has(chapterKey);
          return (
            <div
              key={i}
              onClick={() => onToggle(i)}
              className={
                "flex cursor-pointer items-center gap-3 border-b border-solid border-[color-mix(in_srgb,var(--line)_55%,transparent)] px-3 py-2 transition-colors last:border-b-0 " +
                (isSelected ? "bg-accent-soft" : isDownloaded ? "bg-ok-soft" : "hover:bg-panel-2")
              }
            >
              <Checkbox checked={isSelected} onChange={() => onToggle(i)} />
              <span className={"flex-1 truncate text-[0.75rem] " + (isDownloaded ? "text-ok" : "text-txt")}>{ch.title}</span>
              {isDownloaded && <Icon name="database" size={12} className="shrink-0 text-ok" />}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="py-4 text-center text-[0.75rem] text-txt-dim">{t("noResults")}</p>}
      </div>
    </div>
  );
}

/* ---- download progress ---------------------------------------------------- */

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
  const t = useTranslations("admin.manga.downloader");
  const [showChapters, setShowChapters] = useState(true);
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[0.8125rem]">
          <span className="font-medium text-txt">
            {progress.done ? t("downloadComplete") : t("downloadingN", { completed: progress.completed, total: progress.total })}
          </span>
          <span className="font-mono text-txt-muted">{pct}%</span>
        </div>
        <AvProgressBar value={pct} tone={progress.done ? "green" : "accent"} />
      </div>
      <div className="flex flex-wrap gap-2">
        {progress.totalDownloaded > 0 && <AvPill tone="green" icon="check">{t("imagesDlN", { n: progress.totalDownloaded })}</AvPill>}
        {progress.totalFailed > 0 && <AvPill tone="rose" icon="x">{t("failedN", { n: progress.totalFailed })}</AvPill>}
      </div>
      <button onClick={() => setShowChapters((v) => !v)} className="flex items-center gap-1.5 self-start font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-txt-muted transition-colors hover:text-txt">
        <Icon name={showChapters ? "chevronDown" : "chevronRight"} size={14} />
        {showChapters ? t("hideChaptersN", { n: progress.chapters.length }) : t("showChaptersN", { n: progress.chapters.length })}
      </button>
      {showChapters && (
        <div className="max-h-72 overflow-y-auto border border-solid border-line">
          {progress.chapters.map((ch) => (
            <div key={ch.chapter} className="flex items-center gap-3 border-b border-solid border-[color-mix(in_srgb,var(--line)_55%,transparent)] px-3 py-2 last:border-b-0">
              <Icon name="check" size={13} className={"shrink-0 " + (ch.failed > 0 ? "text-warn" : "text-ok")} />
              <span className="flex-1 truncate text-[0.75rem] text-txt">{ch.chapter}</span>
              <span className="shrink-0 font-mono text-[0.6875rem] text-txt-dim">
                {t("chapterMeta", { dl: ch.downloaded, skip: ch.skipped })}
                {ch.failed > 0 && <span className="text-bad"> · {t("chapterErr", { n: ch.failed })}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- main ------------------------------------------------------------------ */

export default function MangaDownloader() {
  const t = useTranslations("admin.manga.downloader");
  const setSeriesMetadata = useMangaStore((s) => s.setSeriesMetadata);
  const seriesMetadata = useMangaStore((s) => s.seriesMetadata);

  const [library, setLibrary] = useState<LocalMangaLibrary | null>(null);

  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MangaSearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedNovel, setSelectedNovel] = useState<MangaSearchResult | null>(null);
  const [chapters, setChapters] = useState<MangaChapter[] | null>(null);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());

  const [directUrl, setDirectUrl] = useState("");
  const [directUrlLoading, setDirectUrlLoading] = useState(false);
  const [directUrlError, setDirectUrlError] = useState<string | null>(null);

  const [skipDownloaded, setSkipDownloaded] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const downloadedSlugs = useMemo(() => {
    if (!library || !selectedNovel) return new Set<string>();
    const series = library.series.find((s) => s.slug === selectedNovel.title);
    return new Set(series?.chapters.map((c) => c.slug) ?? []);
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
      else setSearchError(res.error ?? t("searchErr"));
    } catch {
      setSearchError(t("connErr"));
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
        setDirectUrl("");
        await handleSelectNovel({ title: res.data.title, url: res.data.url, cover: "" });
      } else {
        setDirectUrlError(res.error ?? t("urlErr"));
      }
    } catch {
      setDirectUrlError(t("connErr"));
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
      else setChaptersError(res.error ?? t("chaptersErr"));
    } catch {
      setChaptersError(t("connErr"));
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
    setSelectedChapters((prev) => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  }, []);

  const toggleAll = useCallback(() => {
    if (!chapters) return;
    setSelectedChapters((prev) => prev.size === chapters.length ? new Set() : new Set(chapters.map((_, i) => i)));
  }, [chapters]);

  const selectRange = useCallback((from: number, to: number) => {
    setSelectedChapters((prev) => {
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
            if (event.type === "start") {
              setProgress((prev) => ({
                novelTitle: event.novelTitle,
                total: (prev?.total ?? 0) + event.total,
                completed: prev?.completed ?? 0,
                chapters: prev?.chapters ?? [],
                done: false,
                totalDownloaded: prev?.totalDownloaded ?? 0,
                totalFailed: prev?.totalFailed ?? 0,
              }));
            } else if (event.type === "chapter") {
              setProgress((prev) => prev ? {
                ...prev,
                completed: prev.completed + 1,
                chapters: [...prev.chapters, { chapter: event.chapter, downloaded: event.downloaded, skipped: event.skipped, failed: event.failed }],
                totalDownloaded: prev.totalDownloaded + event.downloaded,
                totalFailed: prev.totalFailed + event.failed,
              } : prev);
            } else if (event.type === "done") {
              setProgress((prev) => prev ? { ...prev, done: true } : prev);
            }
          },
        );
      }
      setSelectedChapters(new Set());
      await loadLibrary();
    } catch (err) {
      setDownloadError(t("downloadErr", { msg: err instanceof Error ? err.message : String(err) }));
    } finally {
      setDownloading(false);
    }
  };

  const selectedCount = selectedChapters.size;

  return (
    <>
      <div className="max-w-4xl pb-40">
        <AvSectionHead title={t("title")} desc={t("sub")} />

        <ScraperSourcesPanel />

        <AvPanel title={t("search")} icon="search">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput value={query} onChange={setQuery} placeholder={t("searchPlaceholder")} />
            </div>
            <Button variant="pri" onClick={handleSearch} loading={searchLoading} disabled={searchLoading || !query.trim()}>
              {t("searchBtn")}
            </Button>
          </div>
          {searchError && <AvAlert tone="error" className="mt-3">{searchError}</AvAlert>}
        </AvPanel>

        <AvPanel title={t("orUrl")} icon="link">
          <div className="flex gap-2">
            <Input
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !directUrlLoading && directUrl.trim() && handleDirectUrl()}
              placeholder="https://es.novelcool.com/novel/RELIFE.html"
            />
            <Button onClick={handleDirectUrl} loading={directUrlLoading} disabled={directUrlLoading || !directUrl.trim()}>
              {t("load")}
            </Button>
          </div>
          {directUrlError && <AvAlert tone="error" className="mt-3">{directUrlError}</AvAlert>}
        </AvPanel>

        {searchResults && (
          <div className="mb-[1.125rem] flex flex-col gap-2">
            <p className="text-[0.8125rem] text-txt-muted">
              {searchResults.length === 0 ? t("noResults") : t("resultsPick", { n: searchResults.length })}
            </p>
            {searchResults.map((r) => <MgResult key={r.url} title={r.title || r.url} sub={r.url} cover={r.cover} onClick={() => handleSelectNovel(r)} />)}
          </div>
        )}

        {selectedNovel && (
          <AvPanel
            title={selectedNovel.title}
            aside={
              <button onClick={clearNovel} aria-label={t("clear")} className="text-txt-dim transition-colors hover:text-txt">
                <Icon name="x" size={15} />
              </button>
            }
          >
            <div className="flex flex-col gap-4">
              {chaptersLoading && (
                <div className="flex items-center gap-2 py-4 text-[0.8125rem] text-txt-muted">
                  <Spinner size={16} className="text-accent" /> {t("loadingChapters")}
                </div>
              )}
              {chaptersError && <AvAlert tone="error">{chaptersError}</AvAlert>}

              <Disclosure title={t("metadata")} icon="edit">
                <MangaMetadataForm seriesSlug={selectedNovel.title} />
              </Disclosure>

              {chapters && (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-[0.75rem] text-txt-muted">
                    <Icon name="book" size={14} />
                    <span>{t("chaptersN", { n: chapters.length })}</span>
                    {downloadedSlugs.size > 0 && <AvPill tone="green">{t("downloadedN", { n: downloadedSlugs.size })}</AvPill>}
                    <div className="ml-auto">
                      <Toggle on={skipDownloaded} onChange={setSkipDownloaded} label={t("skipDownloaded")} />
                    </div>
                  </div>
                  <ChapterSelector
                    chapters={chapters}
                    selected={selectedChapters}
                    downloadedSlugs={downloadedSlugs}
                    onToggle={toggleChapter}
                    onToggleAll={toggleAll}
                    onSelectRange={selectRange}
                  />
                </>
              )}

              {downloading && (
                <div className="flex items-center gap-2 py-2 text-[0.8125rem] text-signal">
                  <Spinner size={16} /> {t("downloadingNote")}
                </div>
              )}
              {downloadError && <AvAlert tone="error">{downloadError}</AvAlert>}
              {progress && (
                <AvPanel title={progress.done ? t("downloadComplete") : t("progress")} icon={progress.done ? "check" : "download"} className="mb-0">
                  <DownloadProgressPanel progress={progress} />
                </AvPanel>
              )}
            </div>
          </AvPanel>
        )}
      </div>

      <AvStickyBar open={selectedCount > 0 && !downloading}>
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] font-medium text-txt">{t("selectedN", { count: selectedCount })}</p>
          <p className="truncate text-[0.75rem] text-txt-muted">{selectedNovel?.title}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-[0.6875rem] text-txt-dim">
          <Icon name="clock" size={12} />{t("estMin", { n: Math.ceil(selectedCount * 1.5) })}
        </span>
        <Button variant="pri" icon="download" onClick={handleDownload} disabled={downloading}>{t("downloadSelection")}</Button>
      </AvStickyBar>
    </>
  );
}
