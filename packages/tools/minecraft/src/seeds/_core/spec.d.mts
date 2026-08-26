import type { Pack, WaterMode } from "./types";
import type { Evaluator, SeededWorld } from "./evaluator.mjs";

/** JSONC-ish: `//` line comments are stripped, as the annotated example uses them. */
export declare function parseSpec(text: string, label?: string): Record<string, unknown>;
export declare function validateSpec(spec: unknown): true;

/** Builds the evaluator a spec asks for, from packs the host already fetched. */
export declare function evaluatorFor(spec: Record<string, unknown>, packs: Pack[]): Evaluator;

export declare function scanConfig(spec: Record<string, unknown>): {
  radius: number;
  coarseStep: number;
  fineStep: number;
  water: WaterMode;
  origin: [number, number];
};

/**
 * Deliberately loose: the shape is `SpecEvalResult` in `_lib/worker/seeds-api`,
 * which is where the host-facing contract lives. Restating it here would give
 * two declarations of one object that could drift apart, and this file's job is
 * only to make the core callable from TypeScript.
 */
export declare function evaluateSeed(
  ev: Evaluator,
  spec: Record<string, unknown>,
  seed: bigint | number | string,
  reuse?: { world?: SeededWorld; grid?: unknown; geo?: unknown; fineGrids?: Map<string, unknown> },
  opts?: {
    /**
     * Skip the remaining locations once a hard one has failed. The search
     * path's shortcut — a failed seed is never a hit; the editor keeps the
     * full per-location picture by leaving this off.
     */
    stopOnHardFail?: boolean;
  },
): unknown;

/**
 * Level-1 filter: a small biome-only window that never touches the surface
 * scan. `skipped` when the spec declares no prefilter at all.
 */
export declare function prefilterSeed(
  ev: Evaluator,
  spec: Record<string, unknown>,
  seed: bigint | number | string,
  world?: SeededWorld,
): { pass: boolean; skipped?: boolean; failed?: string };

/**
 * Everything that depends on (packs, seed, scan) but NOT on constraint
 * thresholds, computed once and held. This is the shape an interactive editor
 * wants: the first `evaluate` pays for the grid, later ones are milliseconds.
 *
 * It caches ONE seed. It is not a search optimisation.
 */
export declare class Session {
  constructor(ev: Evaluator, spec: Record<string, unknown>, seed: bigint | number | string);
  /** Build the seed-dependent, constraint-independent state. Idempotent. */
  warm(): this;
  /** Re-run against the cached world. Pass the edited spec, not the original. */
  evaluate(spec?: Record<string, unknown>): unknown;
}
