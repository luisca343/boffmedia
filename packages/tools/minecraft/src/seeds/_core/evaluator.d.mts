import type { Climate } from "deepslate";
import type { EvaluatorDescription, Pack, SampleGrid, WaterMode } from "./types";
import type { PackStack } from "./packs.mjs";

/** Bitmask selecting which arrays `sampleGrid` fills. */
export declare const FIELD: {
  readonly BIOME: 1;
  readonly SURFACE: 2;
  readonly WATER: 4;
  readonly CLIMATE: 8;
};

export declare const WATER_MODE: Record<"BIOME" | "PRELIMINARY" | "SEA_LEVEL" | "AUTO" | "EXACT", WaterMode>;
export declare const NO_SURFACE: number;

/** Which water modes need the untrimmed (3.5x more expensive) router. */
export declare function needsFullRouter(mode: WaterMode): boolean;

export declare class SeededWorld {
  readonly seed: bigint;
  readonly seaLevel: number;
  /** The climate sampler behind this seed. Read by the spawn finder, which
   *  needs raw climate rather than a resolved biome. */
  readonly sampler: Climate.Sampler;
  sample(
    x: number,
    z: number,
    opts?: { climate?: boolean; exact?: boolean },
  ): { biome: string; surfaceY: number; isWater: boolean; climate?: Record<string, number> };
  sampleGrid(
    x0: number,
    z0: number,
    nx: number,
    nz: number,
    step: number,
    fields?: number,
    opts?: { water?: WaterMode },
  ): SampleGrid;
}

export declare class Evaluator {
  /**
   * The core's only entry point: packs must already be in memory. Where the
   * bytes came from is the host's problem, never the evaluator's.
   */
  static fromPacks(
    packs: Pack[],
    spec?: {
      minecraftVersion?: string;
      dimension?: string;
      mods?: string[];
      waterBiomes?: string[];
      surfaceScanTop?: number;
      waterBand?: number;
    },
  ): Evaluator;
  readonly seaLevel: number;
  readonly notes: string[];
  /** The loaded packs. Read by the host for pack-supplied display data
   *  (biome colours), never for worldgen — that is `describe()`'s job. */
  readonly stack: PackStack;
  /** Internals the host reads for display only — never for worldgen. */
  readonly world: {
    readonly biomeList: { readonly biomeIds: Set<string> };
    /** The raw noise-settings JSON, for fields the evaluator itself ignores
     *  (`spawn_target`, which only the spawn finder needs). */
    readonly settingsJson: { readonly spawn_target?: unknown };
  };
  describe(): EvaluatorDescription;
  forSeed(seed: bigint | number | string, opts?: { router?: "coarse" | "full" }): SeededWorld;
}
