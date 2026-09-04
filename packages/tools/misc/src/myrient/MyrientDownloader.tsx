"use client";

import { useState, useCallback, useRef } from "react";
import { Button, Icon, Input, Select, Disclosure, Banner, Empty, StatChip, ToolHeader } from "@boffmedia/ui";
import { useToolT, MYRIENT_NS } from "../i18n";
import {
  getCatalog, getLocalGames, searchCatalog, streamDownloadSelected,
  type CatalogResult, type CatalogSearchConsoleResult, type CatalogSearchResult,
  type FileDownloadEntry, type FileDownloadStatus, type GameFileEntry, type SseDoneEvent, type SseEvent,
} from "../api";
import GameCatalogTable from "./GameCatalogTable";
import { CONSOLES, type Manufacturer } from "../shared/consoles";
import { ConsoleChip, RegionChip, MyConsoleGroup, MyStatusIcon, MFR_DOT, MFR_ORDER } from "./my-kit";

const COMMON_REGIONS = ["USA", "Europe", "Japan", "World", "Spain", "France", "Germany", "Italy"];
const CONSOLE_GROUPS = MFR_ORDER.map((mfr) => ({
  mfr,
  entries: Object.entries(CONSOLES).filter(([, v]) => v.manufacturer === mfr),
}));

/* ── download progress ────────────────────────────────────────────────────── */

/** How the RUN ended, as opposed to how any one file ended. Three words because
 *  a user who cancelled, a user whose mirror went quiet and a user who hit a
 *  real error each need to be told something different. */
type RunOutcome = "running" | "finished" | "cancelled" | "error";

/** Byte counters for the transfers currently in flight, keyed by filename. Only
 *  the running ones — an entry is dropped as soon as its file settles. */
type LiveMap = Record<
  string,
  { receivedBytes: number; idleMs: number; idleTimeoutMs: number }
>;

interface ProgressState {
  files: FileDownloadEntry[];
  completed: number;
  total: number;
  summary: SseDoneEvent | null;
  live: LiveMap;
  outcome: RunOutcome;
  /** Set only when `outcome` is "error". */
  errorMsg?: string;
}

/** A transfer counts as quiet once it has spent half the server's idle budget
 *  saying nothing. Half and not all, because the point is to warn BEFORE the
 *  server gives up — otherwise the user is again watching a bar that has
 *  already died without saying so. */
const isQuiet = (v: LiveMap[string]) => v.idleMs >= v.idleTimeoutMs / 2;

const bytes = (n: number) => {
  if (n >= 1_073_741_824) return `${(n / 1_073_741_824).toFixed(2)} GiB`;
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KiB`;
  return `${n} B`;
};

function DownloadProgressPanel({
  progress,
  onCancel,
  cancelling,
}: {
  progress: ProgressState;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const t = useToolT(MYRIENT_NS);
  const [showFiles, setShowFiles] = useState(true);
  const { files, completed, total, summary, live, outcome } = progress;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const counts = files.reduce<Record<FileDownloadStatus, number>>(
    (acc, f) => { acc[f.status]++; return acc; },
    { pending: 0, downloading: 0, downloaded: 0, skipped: 0, failed: 0, stalled: 0, cancelled: 0 },
  );
  const quiet = Object.values(live).filter(isQuiet);
  const running = outcome === "running";
  const headline =
    outcome === "cancelled" ? t("downloadCancelled")
      : outcome === "error" ? t("downloadFailedTitle")
      : summary ? t("downloadComplete")
      : t("downloadingN", { completed, total });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3 text-[0.8125rem]">
          <span className="font-medium text-txt">{headline}</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-txt-muted">{pct}%</span>
            {/* The bar is where a user looks when a download hangs, so the way
                out has to be here — the sticky bar that holds every other
                control is hidden for the whole duration of a run. */}
            {running && (
              <Button size="sm" variant="danger" icon="x" onClick={onCancel} disabled={cancelling}>
                {cancelling ? t("cancelling") : t("cancel")}
              </Button>
            )}
          </div>
        </div>
        <div className="h-2 overflow-hidden bg-base-2">
          <div
            className={
              "h-full transition-[width] duration-300 ease-out " +
              (outcome === "error" ? "bg-bad"
                : outcome === "cancelled" ? "bg-txt-dim"
                : quiet.length ? "bg-warn"
                : summary ? "bg-ok"
                : "bg-accent")
            }
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* A line per transfer that is actually moving. Without it a batch of two
          multi-GiB ROMs was indistinguishable from a dead connection: one bar,
          motionless, for an hour. */}
      {running && Object.keys(live).length > 0 && (
        <div className="flex flex-col gap-1">
          {Object.entries(live).map(([filename, v]) => (
            <div key={filename} className="flex items-center gap-2 text-[0.6875rem]">
              <Icon
                name={isQuiet(v) ? "alert" : "download"}
                size={12}
                className={"flex-none " + (isQuiet(v) ? "text-warn" : "text-signal")}
              />
              <span className="min-w-0 flex-1 truncate text-txt-muted" title={filename}>{filename}</span>
              <span className="shrink-0 font-mono text-txt-dim">{bytes(v.receivedBytes)}</span>
              {isQuiet(v) && (
                <span className="shrink-0 font-mono text-warn">
                  {t("stallWarn", {
                    s: Math.floor(v.idleMs / 1000),
                    limit: Math.floor(v.idleTimeoutMs / 1000),
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em]">
        {counts.downloaded > 0 && <span className="border border-transparent bg-ok-soft px-2 py-1 text-ok">{t("countDownloaded", { n: counts.downloaded })}</span>}
        {counts.skipped > 0 && <span className="border border-transparent bg-warn-soft px-2 py-1 text-warn">{t("countSkipped", { n: counts.skipped })}</span>}
        {counts.failed > 0 && <span className="border border-transparent bg-bad-soft px-2 py-1 text-bad">{t("countFailed", { n: counts.failed })}</span>}
        {counts.stalled > 0 && <span className="border border-transparent bg-warn-soft px-2 py-1 text-warn">{t("countStalled", { n: counts.stalled })}</span>}
        {counts.cancelled > 0 && <span className="border border-line-2 bg-base-2 px-2 py-1 text-txt-dim">{t("countCancelled", { n: counts.cancelled })}</span>}
        {counts.downloading > 0 && <span className="border border-transparent bg-accent-soft px-2 py-1 text-signal">{t("countDownloading", { n: counts.downloading })}</span>}
        {summary && <span className="inline-flex items-center gap-1 border border-line-2 bg-base-2 px-2 py-1 text-txt-muted"><Icon name="database" size={11} />{summary.totalDownloadedSize}</span>}
      </div>

      {/* What makes a stall recoverable instead of mysterious: nothing
          half-written was kept, so re-selecting the file simply works. */}
      {!running && (counts.stalled > 0 || counts.cancelled > 0) && (
        <p className="text-[0.6875rem] text-txt-muted">{t("partialsDiscarded")}</p>
      )}
      {progress.errorMsg && <p className="text-[0.6875rem] text-bad">{progress.errorMsg}</p>}

      <button onClick={() => setShowFiles((v) => !v)} className="flex items-center gap-1.5 self-start font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-txt-muted transition-colors hover:text-txt">
        <Icon name={showFiles ? "chevronDown" : "chevronRight"} size={14} />
        {showFiles ? t("hideFilesN", { n: files.length }) : t("showFilesN", { n: files.length })}
      </button>
      {showFiles && (
        <div className="max-h-80 overflow-y-auto border border-line">
          {files.map((f) => (
            <div key={f.filename} className="flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)] px-3 py-2 last:border-b-0">
              <MyStatusIcon status={f.status} />
              <span className="min-w-0 flex-1 truncate text-[0.75rem] text-txt" title={f.filename}>{f.filename}</span>
              {f.size && <span className="shrink-0 font-mono text-[0.6875rem] text-txt-dim">{f.size}</span>}
              {f.error && <span className="max-w-[8.75rem] shrink-0 truncate text-[0.6875rem] text-bad" title={f.error}>{f.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── main ─────────────────────────────────────────────────────────────────── */

export function MyrientDownloader() {
  const t = useToolT(MYRIENT_NS);
  const [query, setQuery] = useState("");
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [customRegion, setCustomRegion] = useState("");
  const [concurrency, setConcurrency] = useState("2");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [singleCatalog, setSingleCatalog] = useState<CatalogResult | null>(null);
  const [downloadedSet, setDownloadedSet] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [multiCatalog, setMultiCatalog] = useState<CatalogSearchResult | null>(null);
  const [multiSelected, setMultiSelected] = useState<Map<string, Set<string>>>(new Map());
  const [multiDownloadedSet, setMultiDownloadedSet] = useState<Map<string, Set<string>>>(new Map());

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // A ref and not state: aborting must not wait for a render, and the multi-
  // console run reads it between consoles to decide whether to start the next.
  const abortRef = useRef<AbortController | null>(null);

  /** Aborts the fetch, which closes the socket, which is what the API reads as
   *  "the caller hung up" and turns into a real cancel of the transfers it has
   *  in flight. Hiding the panel instead would have left the server pulling
   *  gigabytes for a browser that stopped listening. */
  const cancelDownload = useCallback(() => {
    setCancelling(true);
    abortRef.current?.abort();
  }, []);

  const totalMultiSelected = [...multiSelected.values()].reduce((s, set) => s + set.size, 0);
  const multiConsoleCount = [...multiSelected.values()].filter((s) => s.size > 0).length;

  const toggleRegion = (r: string) => setRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  const addCustomRegion = () => {
    const r = customRegion.trim();
    if (r && !regions.includes(r)) setRegions((prev) => [...prev, r]);
    setCustomRegion("");
  };
  const removeRegion = (r: string) => setRegions((prev) => prev.filter((x) => x !== r));

  const handleConsoleSelect = (key: string) => {
    setSelectedConsole((prev) => (prev === key ? null : key));
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
    setMultiSelected((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(consoleKey) ?? []);
      set.has(name) ? set.delete(name) : set.add(name);
      next.set(consoleKey, set);
      return next;
    });
  }, []);

  const toggleMultiAll = useCallback((consoleKey: string, files: GameFileEntry[]) => {
    setMultiSelected((prev) => {
      const next = new Map(prev);
      const current = next.get(consoleKey) ?? new Set<string>();
      const allSel = files.every((f) => current.has(f.name));
      next.set(consoleKey, allSel ? new Set() : new Set(files.map((f) => f.name)));
      return next;
    });
  }, []);

  const refreshLocalGames = async (consoleKey: string) => {
    try {
      const res = await getLocalGames(consoleKey, regions);
      if (res.success && res.data) setDownloadedSet(new Set(res.data.files.map((f) => f.filename)));
    } catch { /* non-critical */ }
  };

  const refreshMultiDownloaded = async (consoleKeys: string[]) => {
    const entries = await Promise.all(
      consoleKeys.map(async (key) => {
        try {
          const res = await getLocalGames(key, regions);
          if (res.success && res.data) return [key, new Set(res.data.files.map((f) => f.filename))] as const;
        } catch { /* non-critical */ }
        return [key, new Set<string>()] as const;
      }),
    );
    setMultiDownloadedSet((prev) => {
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
          getCatalog(selectedConsole, regions),
          refreshLocalGames(selectedConsole),
        ]);
        if (catalogRes.success && catalogRes.data) setSingleCatalog(catalogRes.data);
        else setError(catalogRes.error ?? catalogRes.message ?? t("catalogError"));
      } else {
        const res = await searchCatalog(query.trim(), regions);
        if (res.success && res.data) {
          await refreshMultiDownloaded(res.data.consoles.map((c) => c.consoleKey));
          setMultiCatalog(res.data);
        } else {
          setError(res.error ?? res.message ?? t("searchError"));
        }
      }
    } catch {
      setError(t("connError"));
    } finally {
      setLoading(false);
    }
  };

  const toggleGame = useCallback((name: string) => setSelected((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; }), []);
  const selectAll = useCallback((names: string[]) => setSelected(new Set(names)), []);
  const clearAll = useCallback(() => setSelected(new Set()), []);

  /** True for the exception an aborted fetch throws. It is not a failure — the
   *  user asked for it — so it must not be reported as one. */
  const isAbort = (err: unknown) =>
    err instanceof DOMException ? err.name === "AbortError" : (err as Error | null)?.name === "AbortError";

  /**
   * Folds one SSE frame into the progress state.
   *
   * `indexBase` exists for the multi-console run, whose per-console streams
   * each count from 1 and would otherwise reset the bar at every console.
   */
  const applyEvent = useCallback((event: SseEvent, indexBase = 0) => {
    setProgress((prev) => {
      if (!prev) return prev;
      switch (event.type) {
        case "active": {
          // Mark the row that is actually running. Every row used to sit on
          // "pending" until it finished, which is what made a dead transfer
          // and a slow one look the same.
          const files = [...prev.files];
          const idx = files.findIndex((f) => f.filename === event.filename && f.status === "pending");
          if (idx !== -1) files[idx] = { ...files[idx], status: "downloading" };
          return { ...prev, files };
        }
        case "tick":
          return {
            ...prev,
            live: {
              ...prev.live,
              [event.filename]: {
                receivedBytes: event.receivedBytes,
                idleMs: event.idleMs,
                idleTimeoutMs: event.idleTimeoutMs,
              },
            },
          };
        case "progress": {
          const files = [...prev.files];
          const idx = files.findIndex(
            (f) => f.filename === event.filename && f.status !== "downloaded" && f.status !== "skipped",
          );
          if (idx !== -1) {
            files[idx] = {
              filename: event.filename,
              status: event.status,
              size: event.size,
              sizeBytes: event.sizeBytes,
              error: event.error,
            };
          }
          // The file has settled, so it is no longer in flight — leaving it in
          // `live` would keep a finished transfer on screen forever.
          const { [event.filename]: _settled, ...live } = prev.live;
          return { ...prev, files, live, completed: indexBase + event.index };
        }
        case "done":
          return {
            ...prev,
            summary: event,
            live: {},
            completed: prev.total,
            outcome: event.aborted ? "cancelled" : prev.outcome === "running" ? "finished" : prev.outcome,
          };
        default:
          return prev;
      }
    });
  }, []);

  const triggerDownload = async (consoleKey: string, games: GameFileEntry[]) => {
    const initialFiles: FileDownloadEntry[] = games.map((g) => ({
      filename: decodeURIComponent(g.link.split("/").pop() ?? g.name),
      status: "pending",
    }));
    setProgress({ files: initialFiles, completed: 0, total: games.length, summary: null, live: {}, outcome: "running" });
    setDownloading(true);
    setCancelling(false);
    setDownloadError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    if (consoleKey === selectedConsole) setSelected(new Set());

    try {
      await streamDownloadSelected(
        { console: consoleKey, games, concurrency: Number(concurrency) },
        (event) => applyEvent(event),
        controller.signal,
      );
      // The server's `done` frame normally settles the outcome. This covers the
      // stream ending without one — otherwise the panel would sit on "running"
      // with no way back.
      setProgress((prev) => (prev && prev.outcome === "running"
        ? { ...prev, live: {}, outcome: controller.signal.aborted ? "cancelled" : "finished" }
        : prev));
    } catch (err) {
      const msg = t("downloadError", { msg: err instanceof Error ? err.message : String(err) });
      if (!isAbort(err)) setDownloadError(msg);
      setProgress((prev) => (prev
        ? { ...prev, live: {}, outcome: isAbort(err) ? "cancelled" : "error", errorMsg: isAbort(err) ? undefined : msg }
        : prev));
    } finally {
      abortRef.current = null;
      setCancelling(false);
      setDownloading(false);
      // Re-read the library either way: a cancelled run still finished whatever
      // it had already completed, and those files are on disk.
      if (consoleKey === selectedConsole) await refreshLocalGames(consoleKey);
    }
  };

  const triggerMultiDownload = async () => {
    if (!multiCatalog) return;
    const plan: { consoleKey: string; games: GameFileEntry[] }[] = [];
    const allInitial: FileDownloadEntry[] = [];

    for (const [consoleKey, names] of multiSelected) {
      if (!names.size) continue;
      const group = multiCatalog.consoles.find((c) => c.consoleKey === consoleKey);
      if (!group) continue;
      const games = group.files.filter((f) => names.has(f.name));
      if (!games.length) continue;
      plan.push({ consoleKey, games });
      for (const g of games) allInitial.push({ filename: decodeURIComponent(g.link.split("/").pop() ?? g.name), status: "pending" });
    }
    if (!allInitial.length) return;

    setProgress({ files: allInitial, completed: 0, total: allInitial.length, summary: null, live: {}, outcome: "running" });
    setDownloading(true);
    setCancelling(false);
    setDownloadError(null);
    setMultiSelected(new Map());
    const controller = new AbortController();
    abortRef.current = controller;

    let globalCompleted = 0;
    try {
      for (const { consoleKey, games } of plan) {
        // One cancel has to stop the WHOLE plan, not just the console that was
        // running when it was pressed.
        if (controller.signal.aborted) break;
        const base = globalCompleted;
        await streamDownloadSelected(
          { console: consoleKey, games, concurrency: Number(concurrency) },
          (event) => {
            // Each console's stream carries its own totals and its own `done`;
            // only the per-file frames belong in the combined panel.
            if (event.type === "done") globalCompleted = base + games.length;
            else applyEvent(event, base);
          },
          controller.signal,
        );
      }
      setProgress((prev) => (prev
        ? {
            ...prev,
            live: {},
            completed: controller.signal.aborted ? prev.completed : prev.total,
            outcome: controller.signal.aborted ? "cancelled" : "finished",
            // Files the plan never reached are reported as cancelled rather than
            // left on "pending", which would read as still-in-progress forever.
            files: controller.signal.aborted
              ? prev.files.map((f) => (f.status === "pending" || f.status === "downloading" ? { ...f, status: "cancelled" as const } : f))
              : prev.files,
          }
        : prev));
    } catch (err) {
      const msg = t("downloadError", { msg: err instanceof Error ? err.message : String(err) });
      if (!isAbort(err)) setDownloadError(msg);
      setProgress((prev) => (prev
        ? { ...prev, live: {}, outcome: isAbort(err) ? "cancelled" : "error", errorMsg: isAbort(err) ? undefined : msg }
        : prev));
    } finally {
      abortRef.current = null;
      setCancelling(false);
      setDownloading(false);
      if (multiCatalog) refreshMultiDownloaded(plan.map((p) => p.consoleKey));
    }
  };

  const handleSingleDownload = () => {
    if (!selectedConsole || selected.size === 0 || !singleCatalog) return;
    const gameMap = new Map(singleCatalog.files.map((f) => [f.name, f]));
    const games = [...selected].map((n) => gameMap.get(n)).filter((f): f is GameFileEntry => !!f);
    triggerDownload(selectedConsole, games);
  };

  const isSearchDisabled = loading || (!selectedConsole && !query.trim());
  const showStickyBar = ((selected.size > 0 && singleCatalog) || (totalMultiSelected > 0 && multiCatalog)) && !downloading;

  return (
    <main className="pb-40">
      {/* header */}
      <ToolHeader
        className="mb-5"
        title={<>{t("titlePre")} <em>{t("titleEm")}</em></>}
        sub={t("sub")}
        meta={
          singleCatalog ? (
            <>
              <StatChip variant="tile" value={singleCatalog.count} label={t("kpiGames")} />
              <StatChip variant="tile" value={singleCatalog.totalSize} label={t("kpiSize")} />
            </>
          ) : multiCatalog ? (
            <>
              <StatChip variant="tile" value={multiCatalog.totalCount} label={t("kpiGames")} />
              <StatChip variant="tile" value={multiCatalog.consoles.length} label={t("kpiConsoles")} />
            </>
          ) : null
        }
      />

      {/* search bar */}
      <form className="mb-[0.875rem] flex flex-wrap items-center gap-[0.75rem]" onSubmit={(e) => { e.preventDefault(); if (!isSearchDisabled) handleSearch(); }}>
        <div className="relative min-w-[13.75rem] max-w-[28.75rem] flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute left-[0.8125rem] top-1/2 -translate-y-1/2 text-txt-dim" />
          <Input
            className="pl-10"
            placeholder={selectedConsole ? t("filterPlaceholder") : t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button variant="pri" type="submit" icon={loading ? "refresh" : "search"} loading={loading} disabled={isSearchDisabled}>
          {selectedConsole ? t("loadBtn") : t("searchAllBtn")}
        </Button>
      </form>

      {/* console filter */}
      <div className="mb-[0.875rem] flex flex-col gap-[0.625rem]">
        <div className="flex items-center gap-[0.5rem]">
          <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-txt-dim">{t("consoleLabel")}</span>
          {selectedConsole ? (
            <span className="cut cut-edge-slant [--cut-line:var(--accent-line)] [--cut:4px] inline-flex items-center border border-accent-line bg-accent-soft px-[0.5rem] py-[0.25rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-accent">
              {CONSOLES[selectedConsole]?.shortLabel ?? selectedConsole}
            </span>
          ) : (
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.06em] text-txt-dim">{t("searchAllHint")}</span>
          )}
        </div>
        <div className="flex flex-col gap-[0.5rem]">
          {CONSOLE_GROUPS.map(({ mfr, entries }) => (
            <div key={mfr} className="flex items-start gap-[0.625rem]">
              <span className="mt-[0.5rem] w-[4rem] flex-none text-right font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em]" style={{ color: MFR_DOT[mfr as Manufacturer] }}>
                {mfr}
              </span>
              <div className="flex flex-wrap gap-[0.375rem]">
                {entries.map(([key, info]) => (
                  <ConsoleChip key={key} label={info.shortLabel} dot={MFR_DOT[mfr as Manufacturer]} on={selectedConsole === key} onClick={() => handleConsoleSelect(key)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* region filter */}
      <div className="mb-[1.25rem]">
        <Disclosure title={t("regionLabel")} icon="filter" sub={regions.length ? regions.join(" · ") : t("regionOptional")}>
          <div className="flex flex-col gap-[0.75rem]">
            <div className="flex flex-wrap gap-[0.375rem]">
              {COMMON_REGIONS.map((r) => (
                <RegionChip key={r} label={r} on={regions.includes(r)} onClick={() => toggleRegion(r)} />
              ))}
            </div>
            <div className="flex gap-[0.5rem]">
              <Input
                className="max-w-[16.25rem]"
                value={customRegion}
                onChange={(e) => setCustomRegion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomRegion(); } }}
                placeholder={t("regionCustomPlaceholder")}
              />
              <Button size="sm" icon="plus" onClick={addCustomRegion} disabled={!customRegion.trim()}>{t("addRegion")}</Button>
            </div>
            {regions.length > 0 && (
              <div className="flex flex-wrap items-center gap-[0.375rem]">
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">{t("activeRegions")}</span>
                {regions.map((r) => (
                  <span key={r} className="cut cut-edge-slant [--cut-line:var(--accent-line)] [--cut:4px] inline-flex items-center gap-[0.375rem] border border-accent-line bg-accent-soft py-[0.25rem] pl-[0.5rem] pr-[0.3125rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-accent">
                    {r}
                    <button type="button" aria-label={t("removeRegion", { r })} onClick={() => removeRegion(r)} className="grid h-[1rem] w-[1rem] place-items-center text-accent/70 transition-opacity hover:text-accent">
                      <Icon name="x" size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Disclosure>
      </div>

      {error && <div className="mb-[1rem]"><Banner tone="error" title={t("errorTitle")}>{error}</Banner></div>}

      {/* single-console catalog */}
      {singleCatalog && (
        <div className="mb-[1.125rem] border border-line bg-panel p-4">
          <GameCatalogTable
            files={singleCatalog.files}
            selected={selected}
            downloadedSet={downloadedSet}
            onToggle={toggleGame}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            initialSearch={query}
          />
        </div>
      )}

      {/* multi-console results */}
      {multiCatalog && (
        <div className="mb-[1.125rem] flex flex-col gap-3">
          {multiCatalog.totalCount === 0 ? (
            <Empty icon="database" title={t("emptyTitle")} lead={multiCatalog.query ? t("emptySearch", { q: multiCatalog.query }) : t("emptyLead")} />
          ) : (
            multiCatalog.consoles.map((c: CatalogSearchConsoleResult) => (
              <MyConsoleGroup
                key={c.consoleKey}
                result={c}
                groupSelected={multiSelected.get(c.consoleKey) ?? new Set()}
                downloadedSet={multiDownloadedSet.get(c.consoleKey) ?? new Set()}
                gamesLabel={(n) => t("gamesN", { n })}
                selectedLabel={(n) => t("selN", { n })}
                selectAllLabel={(n) => t("selectAllN", { n })}
                deselectAllLabel={t("deselectAll")}
                downloadedLabel={t("alreadyDownloaded")}
                onToggle={(name) => toggleMultiGame(c.consoleKey, name)}
                onToggleAll={() => toggleMultiAll(c.consoleKey, c.files)}
                defaultOpen={multiCatalog.consoles.length <= 4}
              />
            ))
          )}
        </div>
      )}

      {/* progress */}
      {progress && (
        <div className="mb-[1.125rem] border border-line bg-panel p-4">
          <p className="mb-3 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-txt-muted">{t("progressTitle")}</p>
          <DownloadProgressPanel progress={progress} onCancel={cancelDownload} cancelling={cancelling} />
        </div>
      )}

      {/* sticky bar */}
      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-solid border-line-2 bg-[color-mix(in_srgb,var(--panel)_96%,transparent)] backdrop-blur">
          <div className="mx-auto flex max-w-[80rem] flex-wrap items-center gap-4 px-10 py-3">
            <div className="min-w-0 flex-1">
              {singleCatalog ? (
                <>
                  <p className="text-[0.875rem] font-medium text-txt">{t("selectedN", { n: selected.size })}</p>
                  <p className="truncate font-mono text-[0.6875rem] text-txt-muted">
                    {CONSOLES[selectedConsole!]?.label}{regions.length > 0 && ` · ${regions.join(", ")}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[0.875rem] font-medium text-txt">{t("selectedN", { n: totalMultiSelected })}</p>
                  <p className="truncate font-mono text-[0.6875rem] text-txt-muted">
                    {t("consolesN", { n: multiConsoleCount })}{regions.length > 0 && ` · ${regions.join(", ")}`}
                  </p>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.06em] text-txt-dim">{t("concurrency")}</span>
              <Select value={concurrency} options={["1", "2", "3", "4", "5"]} onChange={setConcurrency} />
            </div>
            {downloadError && <p className="max-w-xs truncate text-[0.6875rem] text-bad">{downloadError}</p>}
            <Button variant="pri" icon="download" onClick={singleCatalog ? handleSingleDownload : triggerMultiDownload} disabled={downloading}>
              {t("downloadSelection")}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
