/**
 * seeds-api.ts — what the seeds worker exposes over Comlink.
 *
 * The worker owns an `Evaluator` because deepslate's `WorldgenRegistries` is a
 * module-global singleton: two pack stacks in one isolate would silently
 * overwrite each other. On a server that forces a sticky worker pool keyed by
 * stack hash, with eviction and per-user quotas. Here a worker *is* the isolate,
 * so one worker per stack is the whole solution.
 *
 * The worker **samples but does not paint**. That split is load-bearing rather
 * than tidy: sampling a tile costs seconds and painting one costs milliseconds,
 * and every display choice — view mode, hillshade, a biome filter — changes only
 * the paint. Returning pixels would mean re-sampling the world to answer a
 * question the world never had an opinion about. It is the same insight as the
 * CLI's `Session` class (1456 ms to build, 1.4 ms to re-tune), one level up.
 */

import type { EvaluatorDescription, InspectReport, WaterMode } from "../../_core/types";
import type { PackColors } from "../biomeColors";

/** How the worker should get each pack's bytes. Resolved inside the worker. */
export type WorkerPackRef =
  | { kind: "curated"; id: string }
  | { kind: "modrinth"; id: string; project: string; loader: string; gameVersion: string }
  /**
   * A dragged-in pack. The bytes are transferred from the main thread, because
   * `File` handles do not survive a structured clone into a worker in every
   * browser and we are not going to find that out in Safari.
   */
  | { kind: "bytes"; id: string; bytes: ArrayBuffer; source: string };

export interface LoadStackResult {
  readonly describe: EvaluatorDescription;
  /** Present when `audit: true`. The trust gate. */
  readonly inspect?: InspectReport;
  /**
   * Merged `biome_colors.json` from the stack. Sent once per load rather than
   * per tile: it is the pack's own palette and cannot change while the stack is
   * fixed, and Terralith's alone is 94 entries.
   */
  readonly packColors: PackColors;
  /** Every biome the stack can place, for the filter list. */
  readonly biomeIds: string[];
  /**
   * Bytes of pack JSON this worker parsed.
   *
   * A FLOOR on what a worker costs in memory, not the total: the registries
   * built from these files are larger than the files, and there is no way to
   * measure a worker's heap from the main thread. It is reported because it is
   * the one figure here that is actually measured — the UI prices an extra
   * worker with it and says what it is.
   */
  readonly bytes: number;
  readonly ms: { fetch: number; build: number };
}

/**
 * One sampled tile.
 *
 * `samples` is the grid's side in *samples*, not pixels, and the arrays are
 * `(samples + 2)²`. Two separate things are going on:
 *
 * - The `+2` ring is a one-sample border outside the tile, so the hillshade
 *   gradient at edge pixels comes from real neighbours instead of clamped ones.
 *   Without it, every tile boundary shows as a seam.
 * - `samples` can be *fewer* than the tile's pixels. Sampling is the entire cost
 *   of a tile and it is quadratic in this number, so halving it is 4x cheaper.
 *   The painter blows each sample up to a `scale`×`scale` block of pixels.
 *
 * Index interior sample `(x, z)` with `sampleIndex()`.
 */
export interface TileGrid {
  readonly x0: number;
  readonly z0: number;
  /** Samples per side. Arrays are `(samples + 2)²`. */
  readonly samples: number;
  /** Blocks between samples. */
  readonly step: number;
  readonly seaLevel: number;
  /** Index into `palette`. */
  readonly biome: Uint16Array<ArrayBuffer>;
  readonly surfaceY: Int16Array<ArrayBuffer>;
  /** 1 = water. */
  readonly water: Uint8Array<ArrayBuffer>;
  /** Biome ids, numbered per tile by `sampleGrid`. */
  readonly palette: string[];
  readonly ms: number;
}

/** Row-major index into a `TileGrid`'s arrays, skipping the border ring. */
export function sampleIndex(samples: number, x: number, z: number): number {
  return (z + 1) * (samples + 2) + (x + 1);
}

/* ------------------------------------------------------- spec evaluation -- */

/**
 * One constraint's verdict. `value` is what was measured and `detail` is the
 * core's own sentence about it — both are shown, because "fails" without the
 * number is not something a user can act on.
 */
export interface ConstraintResult {
  readonly type: string;
  readonly pass: boolean;
  readonly value: number;
  readonly detail?: string;
}

export interface LocationResult {
  /** Where the site actually resolved to — a discovered location moves. */
  readonly x: number;
  readonly z: number;
  readonly hard: boolean;
  readonly pass: boolean;
  readonly score: number;
  readonly candidatesTried: number;
  readonly constraints: readonly ConstraintResult[];
}

/** `evaluateSeed`'s return value, unchanged. See `_core/spec.mjs`. */
export interface SpecEvalResult {
  readonly seed: string;
  readonly pass: boolean;
  readonly score: number;
  readonly locations: Readonly<Record<string, LocationResult>>;
  readonly scan: { radius: number; step: number; cells: number; waterMode: WaterMode };
  readonly geography: {
    waterBodies: number;
    landMasses: number;
    largestWaterArea: number;
    largestLandArea: number;
  };
}

/**
 * One seed's trip through the search.
 *
 * `result` is present only when the prefilter let the seed through — the whole
 * economy of the search is that most seeds never get one. `ms` is the worker's
 * own wall-clock for the seed, which is what the ETA calibrates against;
 * measuring it on the main thread would time the Comlink round trip too.
 */
export interface SeedCheck {
  readonly seed: string;
  readonly prefiltered: boolean;
  readonly result?: SpecEvalResult;
  readonly ms: number;
}

export interface PrefilterSample {
  readonly tested: number;
  readonly passed: number;
  /** Wall-clock for the whole batch, so the caller can price a real search. */
  readonly ms: number;
}

export type TileMode = "biome" | "terrain" | "water";

export interface TileRequest {
  x0: number;
  z0: number;
  /** Samples per side, excluding the border ring the worker adds. */
  samples: number;
  /** Blocks between samples. */
  step: number;
  water?: WaterMode;
}

export interface SeedsWorkerApi {
  /**
   * Fetch and build. `audit: true` also loads the structure/biome/modifier
   * files the evaluator itself discards, so `inspectPacks` can see them — it
   * roughly doubles parse cost, which is why it is a flag and not the default.
   *
   * `bundleBaseUrl` is passed per call rather than set once at init because the
   * worker has its own module graph: configuring the main thread's copy of
   * `packSource` would not reach this one, and the failure would look like a
   * missing bundle rather than a missing config.
   */
  loadStack(
    refs: readonly WorkerPackRef[],
    opts: { bundleBaseUrl: string; audit?: boolean },
  ): Promise<LoadStackResult>;

  /** Bind a seed. Cheap; the expensive part was `loadStack`. */
  forSeed(seed: string): Promise<{ seaLevel: number; ms: number }>;

  /** One point, exactly. */
  sample(
    x: number,
    z: number,
    opts?: { climate?: boolean; exact?: boolean },
  ): Promise<{ biome: string; surfaceY: number; isWater: boolean; climate?: Record<string, number> }>;

  /**
   * Sample a square tile covering `samples * step` blocks from (`x0`, `z0`).
   *
   * Always samples height, whatever the caller intends to draw. That is not
   * waste: the default `auto` water classification needs the surface scan
   * anyway, so the height field is already paid for — measured, all three view
   * modes cost the same — and having it is what makes hillshade free.
   */
  computeTile(req: TileRequest): Promise<TileGrid>;

  /**
   * Evaluate a spec against one seed, holding a `Session` so that re-running it
   * with only the constraints changed is milliseconds rather than seconds.
   *
   * The session is keyed by seed plus `scanKey` — everything the coarse grid
   * depends on. The caller computes that key (`scanHash`) because it is the
   * caller that knows which edits were cosmetic; handing it in keeps this
   * worker from having to re-derive the same split from the spec twice.
   *
   * This is an EDITOR fast path. It does nothing for throughput across seeds:
   * a `Session` caches one seed, so a search gains nothing by routing through
   * it and would only pin grids in memory.
   */
  evaluateSpec(spec: unknown, seed: string, scanKey: string): Promise<SpecEvalResult>;

  /**
   * Run seeds through the prefilter only, and report how many survived.
   *
   * This exists so the editor can *show* selectivity while a spec is being
   * tuned. The prefilter is what sets the search rate — a spec that rejects 68%
   * of seeds at 3% of the cost of a full evaluation is a spec that can be
   * searched, and one that rejects nothing is not — so it should not be a
   * number the user only discovers by starting a search that never ends.
   */
  prefilterBatch(spec: unknown, seeds: readonly string[]): Promise<PrefilterSample>;

  /**
   * The search's unit of work: prefilter one seed, and fully evaluate it only
   * if it survives.
   *
   * Stateless on purpose — no `Session`. A session caches ONE seed, so a search
   * would gain nothing from it and would pin a coarse grid per worker for a
   * seed it is never going to look at again. Statelessness is also what makes
   * stopping free: there is nothing to unwind, so an in-flight seed can simply
   * be ignored when it lands.
   */
  checkSeed(spec: unknown, seed: string): Promise<SeedCheck>;
}
