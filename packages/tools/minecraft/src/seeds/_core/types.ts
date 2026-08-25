/**
 * Shared types for the ported seedtool core.
 *
 * The core stays plain ESM `.mjs`, near-verbatim from the `seedtool` CLI, so
 * upstream fixes land here as clean diffs instead of being re-derived by hand.
 * That is worth the hand-written `.d.mts` files beside each module; this file
 * holds what more than one of them needs.
 *
 * Types only — nothing here emits, so importing it from a worker costs nothing.
 */

export type WaterMode = "biome" | "preliminary" | "sea_level" | "auto" | "exact";
export type PackMode = "worldgen" | "audit" | "full";

/** One datapack, flattened. `files` keys are `data/<ns>/<category>/<path>.json`. */
export interface Pack {
  readonly name: string;
  readonly kind: string;
  readonly source: string;
  readonly files: Map<string, Uint8Array>;
}

/**
 * A `sampleGrid` result. Every array is `nx * nz`, row-major with z outermost,
 * and is present only if the matching `FIELD` bit was requested — the
 * optionality is real, not defensive typing.
 */
export interface SampleGrid {
  readonly x0: number;
  readonly z0: number;
  readonly nx: number;
  readonly nz: number;
  readonly step: number;
  readonly seaLevel: number;
  readonly waterMode: WaterMode;
  /** Index into `biomePalette`. */
  readonly biome?: Uint16Array;
  readonly biomePalette?: string[];
  readonly surfaceY?: Int16Array;
  /** 1 = water. */
  readonly water?: Uint8Array;
  readonly temperature?: Float32Array;
  readonly humidity?: Float32Array;
  readonly continentalness?: Float32Array;
  readonly erosion?: Float32Array;
  readonly depth?: Float32Array;
  readonly weirdness?: Float32Array;
}

export interface EvaluatorDescription {
  readonly packs: Array<{ name: string; kind: string; files: number; source: string }>;
  readonly dimension: string;
  readonly seaLevel: number;
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly biomes: { entries: number; distinct: number };
  readonly waterBiomes: number;
  readonly provenance: Record<string, unknown>;
  readonly notes: string[];
}

/** The trust gate's report. `verdict` is what decides whether a map is honest. */
export interface InspectReport {
  readonly packs: Array<{ name: string; kind: string; files: number; categories: Record<string, number> }>;
  readonly categories: Record<string, number>;
  readonly overrides: Array<{ id: string; category: string; packs: string[]; winner: string }>;
  /** Worldgen types deepslate cannot evaluate. Non-empty means the map is wrong. */
  readonly unknownTypes: Array<{ type: string; file: string; pack: string }>;
  /** Modifiers that mutate worldgen after the JSON is read — invisible to any static evaluator. */
  readonly runtimeModifiers: Array<{ id: string; pack: string; category: string }>;
  readonly verdict: string[];
}
