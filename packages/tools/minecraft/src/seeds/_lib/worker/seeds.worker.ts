/**
 * seeds.worker.ts — one pack stack, one isolate.
 *
 * This worker exists for a specific reason, not for general politeness about
 * blocking the main thread (though it does that too). deepslate's
 * `WorldgenRegistries` is a module-global singleton: loading two different pack
 * stacks in one isolate silently corrupts both. A worker *is* an isolate, so
 * "one worker per stack" is the entire fix — the sticky pool, hash-keyed
 * eviction and CPU quotas a server would need never come up.
 *
 * It samples and nothing else. See `seeds-api.ts` for why painting lives on the
 * main thread.
 */

import { expose, transfer } from "comlink";

import { packFromBundle, packFromZip } from "../../_core/packs.mjs";
import { Evaluator, FIELD } from "../../_core/evaluator.mjs";
import { Session, evaluateSeed, prefilterSeed } from "../../_core/spec.mjs";
import { inspectPacks } from "../../_core/inspect.mjs";
import type { Evaluator as EvaluatorType, SeededWorld } from "../../_core/evaluator.mjs";
import type { Pack } from "../../_core/types";
import { readPackColors } from "../biomeColors";
import { configureSeedPacks, fetchPack, type PackRef } from "../packSource";
import type {
  LoadStackResult,
  PrefilterSample,
  SeedCheck,
  SeedsWorkerApi,
  SpecEvalResult,
  TileGrid,
  WorkerPackRef,
} from "./seeds-api";

let evaluator: EvaluatorType | null = null;
let world: SeededWorld | null = null;

/**
 * The editor's tuning session (see `evaluateSpec`). One at a time: it pins a
 * coarse grid, connected components and any fine grids for a single seed, which
 * is tens of megabytes at a 12k radius, and the editor only ever looks at one
 * seed at once.
 *
 * Kept entirely separate from `world` above. That one is bound by `forSeed` and
 * belongs to the map; this one builds its own via the evaluator. Sharing them
 * would tie the map's seed to the editor's and make switching either one
 * silently resample the other.
 */
let session: { key: string; s: InstanceType<typeof Session> } | null = null;

function requireEvaluator(): EvaluatorType {
  if (!evaluator) throw new Error("loadStack() has not run — there is no world to sample yet.");
  return evaluator;
}

function requireWorld(): SeededWorld {
  if (!world) throw new Error("forSeed() has not run — no seed is bound.");
  return world;
}

const api: SeedsWorkerApi = {
  async loadStack(refs, opts) {
    configureSeedPacks({ bundleBaseUrl: opts.bundleBaseUrl });
    const mode = opts.audit ? "audit" : "worldgen";

    const t0 = performance.now();
    const fetched = await Promise.all(
      refs.map(async (ref): Promise<Pack> => {
        if (ref.kind === "bytes") {
          return packFromZip(new Uint8Array(ref.bytes), ref.id, { mode, source: ref.source });
        }
        const got = await fetchPack(ref as PackRef);
        return got.format === "bundle"
          ? packFromBundle(got.bytes, got.id, { mode, source: got.source })
          : packFromZip(got.bytes, got.id, { mode, source: got.source });
      }),
    );
    const t1 = performance.now();

    // Registries are global, so a reload must replace the world wholesale —
    // never merge into whatever the previous stack left behind.
    world = null;
    evaluator = Evaluator.fromPacks(fetched);
    const t2 = performance.now();

    // Summed before the result is built, from the files this worker actually
    // parsed — every worker parses the same set, so one worker's figure is
    // every worker's figure.
    let bytes = 0;
    for (const pack of fetched) {
      for (const file of pack.files.values()) bytes += file.byteLength;
    }

    const result: LoadStackResult = {
      describe: evaluator.describe(),
      inspect: opts.audit ? inspectPacks(fetched) : undefined,
      packColors: readPackColors(evaluator.stack),
      biomeIds: [...evaluator.world.biomeList.biomeIds].sort(),
      bytes,
      ms: { fetch: t1 - t0, build: t2 - t1 },
    };
    return result;
  },

  async forSeed(seed) {
    // Seeds arrive as strings because they are 64-bit: a `number` silently
    // rounds anything past 2^53 and would evaluate a different world.
    const t0 = performance.now();
    world = requireEvaluator().forSeed(BigInt(seed));
    return { seaLevel: world.seaLevel, ms: performance.now() - t0 };
  },

  async sample(x, z, opts) {
    return requireWorld().sample(x, z, opts);
  },

  async computeTile(req) {
    const w = requireWorld();
    const t0 = performance.now();

    // Sample one ring wider than the tile, starting one step outside it, so the
    // painter can take a real gradient at the edge pixels. See `TileGrid`.
    const n = req.samples + 2;
    const grid = w.sampleGrid(
      req.x0 - req.step,
      req.z0 - req.step,
      n,
      n,
      req.step,
      FIELD.BIOME | FIELD.WATER | FIELD.SURFACE,
      { water: req.water },
    );

    // `sampleGrid` allocates these fresh per call, so transferring them is
    // safe — nothing in the worker keeps a reference once this returns.
    const biome = grid.biome!;
    const surfaceY = grid.surfaceY!;
    const water = grid.water!;

    const result: TileGrid = {
      x0: req.x0,
      z0: req.z0,
      samples: req.samples,
      step: req.step,
      seaLevel: grid.seaLevel,
      biome: biome as Uint16Array<ArrayBuffer>,
      surfaceY: surfaceY as Int16Array<ArrayBuffer>,
      water: water as Uint8Array<ArrayBuffer>,
      palette: grid.biomePalette ?? [],
      ms: performance.now() - t0,
    };

    // Transferred, not cloned: a full-resolution 256px tile is ~330 KB and a pan
    // moves a dozen at once. Copying them back would undo the point of
    // sampling off-thread.
    return transfer(result, [biome.buffer, surfaceY.buffer, water.buffer]);
  },

  async evaluateSpec(spec, seed, scanKey) {
    const ev = requireEvaluator();
    const key = `${seed}|${scanKey}`;

    // A changed seed or scan invalidates everything the session holds, so it is
    // replaced rather than reused. Dropping the reference first matters: the old
    // grids are the largest thing in this isolate, and building the replacement
    // before releasing them would briefly hold two.
    if (session?.key !== key) {
      session = null;
      session = { key, s: new Session(ev, spec as Record<string, unknown>, seed) };
    }

    // `evaluate(spec)` re-runs the constraint vocabulary over the cached grid.
    // Passing the spec explicitly is what makes threshold edits cheap — the
    // session was constructed with an older copy and must not use it.
    return session.s.evaluate(spec as Record<string, unknown>) as SpecEvalResult;
  },

  async prefilterBatch(spec, seeds) {
    const ev = requireEvaluator();
    const t0 = performance.now();
    let passed = 0;
    for (const seed of seeds) {
      // No `world` argument: `prefilterSeed` builds its own per seed, with the
      // cheap coarse router when the prefilter's water mode allows it. That is
      // the whole reason a rejection costs about what RandomState costs.
      const r = prefilterSeed(ev, spec as Record<string, unknown>, BigInt(seed));
      if (r.pass) passed++;
    }
    const result: PrefilterSample = { tested: seeds.length, passed, ms: performance.now() - t0 };
    return result;
  },

  async checkSeed(spec, seed) {
    const ev = requireEvaluator();
    const s = spec as Record<string, unknown>;
    const t0 = performance.now();

    const pf = prefilterSeed(ev, s, BigInt(seed));
    if (!pf.pass) {
      const miss: SeedCheck = { seed, prefiltered: false, ms: performance.now() - t0 };
      return miss;
    }

    // The prefilter's world is NOT reused. It is built with the cheap coarse
    // router whenever the prefilter's water mode allows it, and the full
    // evaluation usually needs the untrimmed one — handing the coarse world
    // over would silently evaluate a different, wrong world. Rebuilding costs
    // ~13 ms against an evaluation of ~1.5 s.
    const result = evaluateSeed(ev, s, BigInt(seed)) as SpecEvalResult;
    const hit: SeedCheck = { seed, prefiltered: true, result, ms: performance.now() - t0 };
    return hit;
  },
};

expose(api);

export type { SeedsWorkerApi, WorkerPackRef };
