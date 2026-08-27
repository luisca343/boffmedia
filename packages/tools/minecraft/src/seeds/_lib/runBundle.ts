/**
 * runBundle.ts — a finished search, as a file.
 *
 * A search costs an hour of somebody's machine and its result lives only in a
 * React array: reloading the tab throws it away. This module is the file that
 * survives that, and the parser that brings it back so the hits can be audited
 * in the app instead of in a text editor.
 *
 * Three things are deliberate about the format:
 *
 * - **Both specs travel.** `core` is what actually judged the seeds, frozen at
 *   the instant the search started; `ui` is the editor's own state. They are
 *   not reliably derivable from each other — the editor round-trip has been
 *   observed to change a spec — so a bundle carrying only one would either
 *   lose fidelity (no `core`: the scores stop being explainable) or lose
 *   editability (no `ui`: reopening the run cannot fill the panel).
 * - **The pack stack travels.** A hit is a measurement against a specific set
 *   of worldgen data. Without the packs that produced it, a coordinate and a
 *   score are unfalsifiable. The bundle filename carries a content hash, so
 *   recording it is enough to tell "same data" from "same name".
 * - **Hits are verbatim.** `SpecEvalResult` is already JSON — the seed is a
 *   string precisely because it does not fit a number — so the bundle stores
 *   it unprojected. A projection would save perhaps a kilobyte per hit and
 *   cost exactly the per-constraint detail an audit is for.
 *
 * The CSV is the other direction: export only, lossy on purpose, wide so that
 * one row is one seed and a spreadsheet can sort it.
 */

import { BUNDLE_FILES } from "./bundles.generated";
import { CURATED_PACKS } from "./packSource";
import type { SearchProgress } from "./search";
import type { SpecEvalResult } from "./worker/seeds-api";

/**
 * Bumped only for a change a v1 reader would misread. The parser refuses what
 * it does not recognise rather than best-efforting it: a run bundle is read
 * months after it was written, and a half-understood audit is worse than a
 * refusal that names the version.
 */
export const RUN_BUNDLE_FORMAT = "boffmedia.seedfinder.run/1";

/** One pack as it was loaded: id, pinned version, and the hashed bundle file. */
export interface RunBundlePack {
  readonly id: string;
  readonly version: string;
  /** `terralith-2.6.2.0a2b82ad.bin` — the hash is the part that matters. */
  readonly bundle: string;
}

export interface RunBundleStats {
  readonly total: number;
  readonly checked: number;
  readonly evaluated: number;
  readonly hits: number;
  readonly dropped: number;
  readonly elapsedMs: number;
  readonly attrition: Readonly<Record<string, { count: number; percentage: number }>> | null;
}

export interface RunBundle {
  readonly format: typeof RUN_BUNDLE_FORMAT;
  readonly exportedAt: string;
  readonly packs: readonly RunBundlePack[];
  readonly spec: {
    /** The editor's state, restored verbatim on import. */
    readonly ui: unknown;
    /** What judged these seeds. Never edited, only compared against. */
    readonly core: unknown;
  };
  readonly run: RunBundleStats;
  readonly hits: readonly SpecEvalResult[];
}

/** The curated stack, in load order, resolved to what identifies each pack. */
export function packStack(enabled: readonly string[]): RunBundlePack[] {
  return CURATED_PACKS.filter((p) => enabled.includes(p.id))
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((p) => ({ id: p.id, version: p.version, bundle: BUNDLE_FILES[p.id] ?? "" }));
}

/**
 * Pack ids where the bundle disagrees with what is loaded now — a pack the run
 * used and this session does not, one this session has and the run did not, or
 * one both have at different bytes. Empty means the map can be trusted to
 * agree with the results.
 */
export function packMismatch(
  bundle: readonly RunBundlePack[],
  current: readonly RunBundlePack[],
): string[] {
  const byId = new Map(current.map((p) => [p.id, p]));
  const out: string[] = [];
  for (const p of bundle) {
    const mine = byId.get(p.id);
    if (!mine || mine.bundle !== p.bundle) out.push(p.id);
  }
  for (const p of current) {
    if (!bundle.some((b) => b.id === p.id)) out.push(p.id);
  }
  return [...new Set(out)].sort();
}

export function buildRunBundle(input: {
  packs: readonly RunBundlePack[];
  uiSpec: unknown;
  coreSpec: unknown;
  progress: SearchProgress;
  hits: readonly SpecEvalResult[];
  /** Passed in rather than read here, so the module stays pure and testable. */
  exportedAt: string;
}): RunBundle {
  const { progress } = input;
  return {
    format: RUN_BUNDLE_FORMAT,
    exportedAt: input.exportedAt,
    packs: input.packs,
    spec: { ui: input.uiSpec, core: input.coreSpec },
    run: {
      total: progress.total,
      checked: progress.checked,
      evaluated: progress.evaluated,
      // `progress.hits` counts everything that passed; `hits.length` is what
      // survived the MAX_HITS cap. Both are kept: the first is the rate the
      // spec actually achieved, the second is what this file contains.
      hits: progress.hits,
      dropped: progress.dropped,
      elapsedMs: progress.elapsedMs,
      attrition: progress.attrition,
    },
    hits: input.hits,
  };
}

/** Thrown for anything a reader must not guess its way past. */
export class RunBundleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunBundleError";
  }
}

/**
 * Parse and validate. Structural only — it proves the file is a run bundle of
 * a version this build understands and that its hits carry the fields the
 * panel reads, not that the numbers in it are true.
 */
export function parseRunBundle(text: string): RunBundle {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new RunBundleError(e instanceof Error ? e.message : String(e));
  }
  if (!raw || typeof raw !== "object") throw new RunBundleError("not an object");
  const b = raw as Record<string, unknown>;

  if (b.format !== RUN_BUNDLE_FORMAT) {
    throw new RunBundleError(`format ${String(b.format ?? "missing")}`);
  }
  if (!Array.isArray(b.hits)) throw new RunBundleError("hits");
  const spec = b.spec as { ui?: unknown; core?: unknown } | undefined;
  if (!spec || typeof spec !== "object" || !spec.ui || !spec.core) {
    throw new RunBundleError("spec");
  }

  for (const hit of b.hits as unknown[]) {
    const h = hit as Record<string, unknown> | null;
    if (!h || typeof h.seed !== "string" || typeof h.score !== "number" || !h.locations) {
      throw new RunBundleError("hit");
    }
  }

  return {
    format: RUN_BUNDLE_FORMAT,
    exportedAt: typeof b.exportedAt === "string" ? b.exportedAt : "",
    packs: Array.isArray(b.packs) ? (b.packs as RunBundlePack[]) : [],
    spec: { ui: spec.ui, core: spec.core },
    run: normaliseStats(b.run),
    hits: b.hits as SpecEvalResult[],
  };
}

function normaliseStats(raw: unknown): RunBundleStats {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const n = (k: string) => (typeof r[k] === "number" ? (r[k] as number) : 0);
  return {
    total: n("total"),
    checked: n("checked"),
    evaluated: n("evaluated"),
    hits: n("hits"),
    dropped: n("dropped"),
    elapsedMs: n("elapsedMs"),
    attrition:
      r.attrition && typeof r.attrition === "object"
        ? (r.attrition as RunBundleStats["attrition"])
        : null,
  };
}

/* ------------------------------------------------------------------ csv -- */

function cell(value: string | number | boolean): string {
  const s = String(value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * Wide: one row per seed, with a column block per location.
 *
 * The location columns come from the union of every hit's keys rather than
 * from the spec, so a bundle opens as a table even when its spec is not to
 * hand, and a location missing from one seed leaves blanks instead of shifting
 * that row out of alignment with the header.
 */
export function runBundleCsv(hits: readonly SpecEvalResult[]): string {
  const keys = [...new Set(hits.flatMap((h) => Object.keys(h.locations)))].sort();

  const header = [
    "seed",
    "pass",
    "score",
    "water_bodies",
    "land_masses",
    "largest_water_area",
    "largest_land_area",
    ...keys.flatMap((k) => [`${k}_x`, `${k}_z`, `${k}_pass`, `${k}_score`, `${k}_failed`]),
  ];

  const rows = hits.map((h) => [
    h.seed,
    h.pass,
    h.score,
    h.geography.waterBodies,
    h.geography.landMasses,
    h.geography.largestWaterArea,
    h.geography.largestLandArea,
    ...keys.flatMap((k): Array<string | number | boolean> => {
      const loc = h.locations[k];
      if (!loc) return ["", "", "", "", ""];
      // Which constraints rejected it, not how many: a count says a seed is
      // imperfect, a list says why, and that is the column an audit sorts on.
      const failed = loc.constraints
        .filter((c) => !c.pass)
        .map((c) => c.type)
        .join(";");
      return [loc.x, loc.z, loc.pass, loc.score, failed];
    }),
  ]);

  // CRLF and a BOM: Excel reads a bare-LF UTF-8 CSV as one column of mojibake,
  // and a spreadsheet nobody can open is not an export.
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
