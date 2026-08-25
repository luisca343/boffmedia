"use client";

/**
 * WorkerControl — how many isolates to search with, and what each one costs.
 *
 * The control exists because "add more workers" is the obvious idea and the
 * weakest one, and a slider that says so honestly is worth more than a fixed
 * default nobody can interrogate. Three facts are put next to the number:
 *
 * - **Time.** Recomputed for the chosen count from the same estimator the panel
 *   uses, so moving the slider shows what it buys before it costs anything.
 * - **Memory.** `bytes` is measured — it is the pack JSON each worker parsed —
 *   and it is labelled as a *floor*, because the registries built from those
 *   files are larger and a worker's heap cannot be read from this thread. A
 *   measured floor beats a confident invention.
 * - **Startup.** Also measured, from the base pool's own load. Every extra
 *   worker pays it before it can help, which is why a big pool is a bad trade
 *   for a small search.
 *
 * Past `hardwareConcurrency` there are no more cores to run on, so the extra
 * isolates queue against each other while still each paying full memory and
 * startup. The scale says that at the point where it starts being true rather
 * than in a footnote.
 */

import type { Translate } from "@boffmedia/ui/i18n";
import { DEFAULT_WORKER_COUNT } from "../_lib/pool";
import { effectiveWorkers } from "../_lib/search";

export interface WorkerControlProps {
  value: number;
  onChange: (n: number) => void;
  /** Cores this machine reports, or 0 when it will not say. */
  cores: number;
  /** Pack JSON parsed per worker, in bytes. Measured; a floor, not a total. */
  stackBytes: number;
  /** Measured fetch + build for one worker's stack. */
  stackLoadMs: number;
  /** Estimated run time at the current worker count, in ms. */
  estimateMs: number | null;
  /** Estimated run time at the recommended count, for comparison. */
  baselineMs: number | null;
  disabled?: boolean;
  t: Translate;
}

const MB = 1024 * 1024;

export function WorkerControl({
  value,
  onChange,
  cores,
  stackBytes,
  stackLoadMs,
  estimateMs,
  baselineMs,
  disabled,
  t,
}: WorkerControlProps) {
  // The slider may go past what the machine can use — that is the point, since
  // the question "is more better?" is only answerable by being allowed to try —
  // but it stops well short of anything that would take the tab down.
  const max = Math.max(16, cores || 8);
  const recommended = Math.max(DEFAULT_WORKER_COUNT, Math.min(16, (cores || 6) - 2));

  const searching = Math.max(1, value - 1);
  // How many of those can actually run at once. When this is below `searching`,
  // the surplus workers exist but cannot compute — which is exactly why the
  // estimate stops improving, and saying it here is what makes that visible
  // rather than mysterious.
  const effective = effectiveWorkers(value, cores);
  const saturated = effective < searching;
  const overCommitted = cores > 0 && value > cores;
  const crowded = cores > 0 && !overCommitted && value > cores - 2;

  // Only the workers beyond the four already running are new cost.
  const extra = Math.max(0, value - DEFAULT_WORKER_COUNT);

  const delta =
    estimateMs !== null && baselineMs !== null && baselineMs > 0
      ? Math.round((1 - estimateMs / baselineMs) * 100)
      : null;

  return (
    <div className="grid gap-2 border border-line-2 bg-base p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-txt-dim">
          {t("search.workerCount")}
        </span>
        <span className="font-mono text-[12px] text-txt">
          {value}
          <span className={saturated ? "text-danger" : "text-txt-dim"}>
            {" · "}
            {saturated
              ? t("search.searchingCapped", { n: searching, effective })
              : t("search.searchingWith", { n: searching })}
          </span>
        </span>
      </div>

      <input
        type="range"
        min={DEFAULT_WORKER_COUNT}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
        aria-label={t("search.workerCount")}
      />

      <div className="flex justify-between font-mono text-[9px] text-txt-dim">
        <span>{DEFAULT_WORKER_COUNT}</span>
        <span>{t("search.recommended", { n: recommended })}</span>
        <span>{max}</span>
      </div>

      <ul className="grid list-none gap-1 p-0 font-mono text-[10px] leading-snug text-txt-dim">
        {/* Only shown once there is something to compare against, so the panel
            never claims a speed-up it has not computed. */}
        {delta !== null && delta !== 0 ? (
          <li className={delta > 0 ? "text-ok" : "text-danger"}>
            {delta > 0
              ? t("search.impactFaster", { pct: delta })
              : t("search.impactSlower", { pct: -delta })}
          </li>
        ) : null}

        {stackBytes > 0 ? (
          <li>
            {t("search.impactMemory", {
              copies: value,
              mb: (stackBytes / MB).toFixed(1),
              total: ((stackBytes * value) / MB).toFixed(0),
            })}
          </li>
        ) : null}

        {extra > 0 && stackLoadMs > 0 ? (
          <li>{t("search.impactStartup", { n: extra, s: (stackLoadMs / 1000).toFixed(1) })}</li>
        ) : null}
      </ul>

      {overCommitted ? (
        <p className="border-l-2 border-danger pl-2 text-[10px] leading-snug text-danger">
          {t("search.warnOverCommitted", { cores })}
        </p>
      ) : crowded ? (
        <p className="border-l-2 border-line pl-2 text-[10px] leading-snug text-txt-dim">
          {t("search.warnCrowded")}
        </p>
      ) : null}
    </div>
  );
}
