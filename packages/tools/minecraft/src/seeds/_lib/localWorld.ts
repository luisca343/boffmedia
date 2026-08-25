/**
 * localWorld.ts — a fifth evaluator, on the main thread, purely for hover.
 *
 * This is what jacobsjo/mc-datapack-map does: `MainMap.vue` calls
 * `biomeSource.getBiome(x >> 2, y >> 2, z >> 2, sampler)` synchronously inside
 * its `mousemove` handler. It can only do that because it keeps a biome source
 * on the main thread, alongside its workers. So do we, now.
 *
 * The alternative — asking a worker per mousemove — is a round trip per frame
 * for an answer the cursor has already moved past. The alternative *to that* is
 * reading the painted tile, which is free but reports the biome sampled for
 * that pixel; at 128 blocks/pixel that can be a different biome from the one
 * actually under the cursor. Hover is a claim about a coordinate, so it should
 * be exact.
 *
 * What it costs: one more copy of the registries (built in ~50 ms, blocking the
 * main thread once at load) and the memory behind it. Note the registries are
 * module-global *per isolate*, so this copy is entirely separate from the
 * workers' — and `buildWorld` clears both registries before registering, so
 * rebuilding here on a stack change replaces rather than accumulates.
 */

import { Evaluator } from "../_core/evaluator.mjs";
import type { Evaluator as EvaluatorType, SeededWorld } from "../_core/evaluator.mjs";
import { packFromBundle, packFromZip } from "../_core/packs.mjs";
import type { Pack } from "../_core/types";
import { configureSeedPacks, fetchPack, type PackRef } from "./packSource";
import { findSpawn, type SpawnResult } from "./spawnPoint";
import type { WorkerPackRef } from "./worker/seeds-api";

export interface LocalSample {
  readonly biome: string;
  readonly surfaceY: number;
  readonly isWater: boolean;
}

/**
 * Caches by quart — Minecraft stores biomes on a 4-block grid, so every
 * coordinate inside one quart has the same answer and the mouse crosses many
 * pixels per quart when zoomed in.
 *
 * jacobsjo's `CachedBiomeSource` keeps an 11×11 window around a moving centre.
 * A bounded map keyed on the quart is the same idea with less bookkeeping, and
 * it also covers the sweep-away-and-back case their window drops.
 */
const CACHE_LIMIT = 4096;

export class LocalWorld {
  private evaluator: EvaluatorType | null = null;
  private world: SeededWorld | null = null;
  private cache = new Map<string, LocalSample>();

  get ready(): boolean {
    return this.world !== null;
  }

  async load(refs: readonly WorkerPackRef[], bundleBaseUrl: string): Promise<void> {
    configureSeedPacks({ bundleBaseUrl });

    // The same URLs the workers fetched moments ago, so these come straight out
    // of the HTTP cache — which only holds because bundle filenames carry a
    // content hash and are served immutable.
    const packs = await Promise.all(
      refs.map(async (ref): Promise<Pack> => {
        if (ref.kind === "bytes") {
          return packFromZip(new Uint8Array(ref.bytes), ref.id, { source: ref.source });
        }
        const got = await fetchPack(ref as PackRef);
        return got.format === "bundle"
          ? packFromBundle(got.bytes, got.id, { source: got.source })
          : packFromZip(got.bytes, got.id, { source: got.source });
      }),
    );

    this.world = null;
    this.cache.clear();
    this.evaluator = Evaluator.fromPacks(packs);
  }

  forSeed(seed: string): void {
    if (!this.evaluator) return;
    this.cache.clear();
    this.world = this.evaluator.forSeed(BigInt(seed));
  }

  /**
   * The exact surface sample at a block coordinate, or `null` before the world
   * is built. Synchronous by design — this is called from `mousemove`.
   *
   * Costs a preliminary-surface scan plus a climate lookup, roughly 50 µs, which
   * is about 0.3% of a 60 fps frame. The cache makes repeats free.
   */
  sampleAt(x: number, z: number): LocalSample | null {
    if (!this.world) return null;

    const key = `${x >> 2}|${z >> 2}`;
    const hit = this.cache.get(key);
    if (hit) return hit;

    const s = this.world.sample(Math.round(x), Math.round(z));
    const value: LocalSample = { biome: s.biome, surfaceY: s.surfaceY, isWater: s.isWater };

    // Plain size cap rather than an LRU: entries are interchangeable and a
    // wholesale clear costs one re-sample per quart, which is microseconds.
    if (this.cache.size >= CACHE_LIMIT) this.cache.clear();
    this.cache.set(key, value);
    return value;
  }

  /**
   * Where the game would aim you. Computed here rather than in a worker because
   * it needs the climate sampler and about a thousand samples — roughly 11 ms,
   * which is not worth a round trip, and this thread already has a sampler for
   * hover.
   */
  findSpawn(): SpawnResult | null {
    if (!this.world || !this.evaluator) return null;
    return findSpawn(this.evaluator.world.settingsJson.spawn_target, this.world.sampler);
  }

  dispose(): void {
    this.evaluator = null;
    this.world = null;
    this.cache.clear();
  }
}
