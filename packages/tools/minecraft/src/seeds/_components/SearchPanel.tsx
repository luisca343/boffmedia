"use client";

/**
 * SearchPanel — how many seeds, how long that will take, and what turned up.
 *
 * The panel is built around one promise it must not break: **the cost is stated
 * before the button is pressed.** A browser search covers tens of thousands of
 * seeds in a session, not millions (D1), and the way that stops being a
 * disappointment is for the count and the estimate to be on screen next to the
 * choice rather than discovered afterwards from a progress bar that never
 * fills. The ceiling is written out too, in words, for the same reason.
 *
 * While a search runs the estimate stops being a prediction and becomes a
 * measurement of this run — the published baselines proved ~2× conservative in
 * a real browser, and an estimate that argues with the counter beside it is
 * worse than none.
 *
 * Results are the seeds that PASSED, ranked by score. Seeds that failed are not
 * listed at all: the spec is the filter, so a list of things it rejected would
 * be a list of everything.
 *
 * The results also leave and come back as a file, from the header of the panel
 * that lists them. A search costs an hour of a real machine and lived, until
 * now, only until the tab was reloaded; a run bundle makes that hour something
 * you can keep, send to somebody, and open again to audit seed by seed. The
 * panel itself only picks the file and shows what came of it — see
 * `_lib/runBundle.ts` for what is in one and why.
 */

import { useEffect, useRef, useState } from "react";
import { Button, Panel, Seg } from "@boffmedia/ui";

import type { Translate } from "@boffmedia/ui/i18n";
import { DEFAULT_WORKER_COUNT, searchPoolTarget } from "../_lib/pool";
import type { SpecEvalResult } from "../_lib/worker/seeds-api";
import { estimateMs, MAX_HITS, type SearchProgress } from "../_lib/search";
import { AttritionReport } from "./AttritionReport";
import { HitRow } from "./HitRow";
import { WorkerControl } from "./WorkerControl";

/** D1's honest range. 50k is about an hour on four cores and minutes on twenty. */
const COUNTS = [1000, 10000, 50000] as const;

export interface SearchPanelProps {
  progress: SearchProgress;
  hits: readonly SpecEvalResult[];
  dropped: number;
  /** Fraction the prefilter lets through, if it has been measured. */
  survivorRate: number | null;
  /**
   * Whether the spec declares a prefilter at all. Without one every seed pays
   * for a full evaluation and `survivorRate` does not apply.
   */
  prefiltered: boolean;
  /** Cost of one cold evaluation of this spec, timed by the editor. */
  perSeedMs: number | null;
  count: number;
  onCountChange: (n: number) => void;
  /** Pool size to grow to during a search. 0 until read on mount. */
  workerTarget: number;
  onWorkerTargetChange: (n: number) => void;
  /** Measured pack JSON per worker, and what one worker's stack cost to load. */
  stackBytes: number;
  stackLoadMs: number;
  onStart: () => void;
  onStop: () => void;
  /** Locations present in the spec, so a hit can be checked against real names. */
  ready: boolean;
  /**
   * Write the results out. `json` is the round-trippable run bundle; `csv` is
   * the flat table, which cannot come back.
   */
  onExportRun: (format: "json" | "csv") => void;
  /** Read a run bundle back in. The panel only picks the file. */
  onOpenRun: (file: File) => void;
  /**
   * Set while the listed hits came from a file rather than from this session.
   * `packMismatch` names the packs whose bytes differ from what is loaded now —
   * the results still show, because refusing to open a run whose packs have
   * since been rebuilt would make old audits unreadable, but a map drawn from
   * different worldgen data than the one that scored these seeds cannot be
   * allowed to look like agreement.
   */
  importedRun: { exportedAt: string; packMismatch: readonly string[] } | null;
  /** Last import failure, already translated. */
  importError: string | null;
  seedOnMap: string;
  onPickSeed: (seed: string) => void;
  onFocusSite: (x: number, z: number) => void;
  t: Translate;
}

function formatDuration(ms: number, t: Translate): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return t("search.seconds", { n: s });
  const m = Math.round(s / 60);
  if (m < 60) return t("search.minutes", { n: m });
  return t("search.hours", { n: (m / 60).toFixed(1) });
}

/**
 * The bundle's timestamp, in the reader's own locale.
 *
 * Rendered from an ISO string the file carries, so a run exported in one
 * timezone reads correctly when it is opened in another. An unparseable or
 * missing stamp falls back to the raw text rather than printing "Invalid Date".
 */
function formatStamp(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function SearchPanel({
  progress,
  hits,
  dropped,
  survivorRate,
  prefiltered,
  perSeedMs,
  count,
  onCountChange,
  workerTarget,
  onWorkerTargetChange,
  stackBytes,
  stackLoadMs,
  onStart,
  onStop,
  ready,
  onExportRun,
  onOpenRun,
  importedRun,
  importError,
  seedOnMap,
  onPickSeed,
  onFocusSite,
  t,
}: SearchPanelProps) {
  const { running, checked, total, evaluated, elapsedMs, etaMs, workers } = progress;

  // The only way a browser opens a file picker is a click on a real input, so
  // one is kept hidden and clicked from the button beside the results.
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pickFile = () => fileRef.current?.click();

  /**
   * How large the pool will grow, read after mount rather than during render.
   *
   * `navigator` does not exist on the server, so branching on it while
   * rendering is the same hydration break the tool already hit once with the
   * URL hash: the server would size the estimate for 4 workers and the client
   * for however many this machine has. It starts at the pool's own floor, which
   * is what the server would have said anyway.
   *
   * `searchPoolTarget()` rather than a second copy of the arithmetic — the
   * local copy had already drifted, missing the 16-worker cap, so a 32-core
   * machine was quoted an estimate for 30 workers against a pool that stops
   * at 16.
   */
  const [poolTarget, setPoolTarget] = useState(DEFAULT_WORKER_COUNT);
  const [cores, setCores] = useState(0);
  useEffect(() => {
    setPoolTarget(searchPoolTarget());
    setCores(navigator.hardwareConcurrency ?? 0);
  }, []);

  // The size the user chose, falling back to this machine's default until the
  // mount effect has filled it in. Distinct from `workers` above, which is how
  // many the RUNNING search actually got — they differ while a search is live
  // and the slider has since been moved.
  const chosen = workerTarget || poolTarget;

  // Before a search: the published baseline against the pool the user has
  // chosen. During: whatever the run itself is doing.
  const estimate = running
    ? etaMs
    : estimateMs(count, chosen, survivorRate ?? undefined, cores, { prefiltered, perSeedMs });

  // Both estimates are quoted for a POOL size, worker 0 included: this one for
  // the pool asked for, the running one for `workers + 1`, the pool actually
  // granted. They agree as long as `growForSearch` delivers what it is asked
  // for. When it does not, the shortfall is said out loud rather than left to
  // show up as an estimate that argues with the counter beside it.
  const grantedPool = workers > 0 ? workers + 1 : 0;
  const poolShort = running && grantedPool > 0 && grantedPool < chosen;

  // What the recommended pool would cost, so the slider can say what moving it
  // is worth rather than only what it is set to.
  const baseline = estimateMs(count, poolTarget, survivorRate ?? undefined, cores, {
    prefiltered,
    perSeedMs,
  });

  return (
    <>
      <Panel
        title={t("search.title")}
        aside={
          running ? (
            <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
              {t("search.workers", { n: workers })}
            </span>
          ) : null
        }
      >
        <div className="grid gap-3">
          <p className="text-[11px] leading-snug text-txt-dim">{t("search.lead")}</p>

          <Seg
            className="w-full"
            value={String(count)}
            onChange={(v) => onCountChange(Number(v))}
            options={COUNTS.map((n) => ({ value: String(n), label: n >= 1000 ? `${n / 1000}k` : String(n) }))}
          />

          <WorkerControl
            value={chosen}
            onChange={onWorkerTargetChange}
            cores={cores}
            stackBytes={stackBytes}
            stackLoadMs={stackLoadMs}
            estimateMs={running ? null : estimate}
            baselineMs={running ? null : baseline}
            // Changing the pool mid-run would do nothing: `growForSearch` is
            // called once, at the start. Locking it says so.
            disabled={running}
            t={t}
          />

          {estimate !== null ? (
            <p className="border border-line-2 bg-base px-2.5 py-2 font-mono text-[11px] text-txt-dim">
              {running
                ? t("search.remaining", { time: formatDuration(estimate, t) })
                : t("search.estimate", { time: formatDuration(estimate, t) })}
            </p>
          ) : null}

          <Button size="sm" variant={running ? "ghost" : "pri"} onClick={running ? onStop : onStart} disabled={!ready}>
            {running ? t("search.stop") : t("search.start")}
          </Button>

          {checked > 0 ? (
            <div className="grid gap-1.5">
              {/* Progress against the fixed draw, so the bar is a fraction of a
                  known total rather than of an open-ended hunt. */}
              <div className="h-1.5 w-full bg-line-2">
                <div
                  className="h-full bg-accent transition-[width] duration-200"
                  style={{ width: `${total ? Math.round((checked / total) * 100) : 0}%` }}
                />
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-txt-dim">
                {t("search.checked", { checked, total })}
                <br />
                {t("search.evaluated", { n: evaluated })} · {t("search.elapsed", { time: formatDuration(elapsedMs, t) })}
              </p>
            </div>
          ) : null}

          {poolShort ? (
            <p className="font-mono text-[10px] leading-snug text-txt-dim">
              {t("search.poolShort", { got: grantedPool, asked: chosen })}
            </p>
          ) : null}

          {progress.error ? (
            <p className="font-mono text-[10px] leading-snug text-danger">{progress.error}</p>
          ) : null}

          {/* D1, said out loud rather than implied by a capped dropdown. */}
          <p className="border-t border-line-2 pt-2.5 text-[10px] leading-snug text-txt-dim">
            {t("search.ceiling")}
          </p>
        </div>
      </Panel>

      <Panel
        title={t("search.results")}
        aside={
          <>
            <span className="font-mono text-[11px] text-txt-dim">
              {hits.length}
              {dropped > 0 ? ` (+${dropped})` : ""}
            </span>
            {/* Beside the count they act on. Export is disabled with nothing to
                write; opening a run is not, because an empty list is exactly
                when somebody wants to load one. */}
            <Button
              size="sm"
              variant="ghost"
              disabled={!hits.length || running}
              onClick={() => onExportRun("json")}
              title={t("run.export.json")}
            >
              {t("run.export.jsonShort")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!hits.length || running}
              onClick={() => onExportRun("csv")}
              title={t("run.export.csv")}
            >
              {t("run.export.csvShort")}
            </Button>
            <Button size="sm" variant="ghost" disabled={running} onClick={pickFile}>
              {t("run.open")}
            </Button>
            {/* Off-screen rather than absent: the file input is the only way a
                browser will open a picker, and styling one is not worth it. */}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Cleared so re-opening the SAME file fires `change` again;
                // without this a failed import cannot be retried.
                e.target.value = "";
                if (file) onOpenRun(file);
              }}
            />
          </>
        }
      >
        {importedRun ? (
          <div className="mb-2.5 grid gap-1 border border-line-2 bg-base px-2.5 py-2">
            <p className="font-mono text-[10px] leading-snug text-txt-dim">
              {t("run.imported", { date: formatStamp(importedRun.exportedAt) })}
            </p>
            {importedRun.packMismatch.length ? (
              <p className="font-mono text-[10px] leading-snug text-danger">
                {t("run.packMismatch", { packs: importedRun.packMismatch.join(", ") })}
              </p>
            ) : null}
          </div>
        ) : null}

        {importError ? (
          <p className="mb-2.5 font-mono text-[10px] leading-snug text-danger">
            {t("run.openFailed", { message: importError })}
          </p>
        ) : null}

        {/* Above the list, at reading size, because a ranked table of seeds
            with scores reads as a verified result and nothing here has been
            opened in Minecraft. The per-hit row carries the /tp checklist that
            turns this into something checkable. */}
        <p className="mb-2.5 border-l-2 border-line pl-2 text-[11px] leading-snug text-txt-dim">
          {t("search.unverified")}
        </p>

        {hits.length ? (
          <div className="grid gap-1.5">
            {hits.map((hit) => (
              <HitRow
                key={hit.seed}
                hit={hit}
                current={hit.seed === seedOnMap}
                onPick={() => onPickSeed(hit.seed)}
                onFocusSite={onFocusSite}
                t={t}
              />
            ))}
            {dropped > 0 ? (
              <p className="pt-1 text-[10px] leading-snug text-txt-dim">
                {t("search.dropped", { n: dropped, kept: MAX_HITS })}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-[11px] leading-snug text-txt-dim">
            {running ? t("search.searching") : t("search.noResults")}
          </p>
        )}

        {progress.attrition ? (
          <div className="mt-3">
            <AttritionReport data={progress.attrition} t={t} />
          </div>
        ) : null}
      </Panel>
    </>
  );
}
