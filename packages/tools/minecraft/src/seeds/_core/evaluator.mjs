/**
 * evaluator.mjs — the §6 evaluator API.
 *
 *   Evaluator.load(spec)  → expensive, seed-independent (parse + registries)
 *   evaluator.forSeed(n)  → per-seed sampler (12.7 ms with the trimmed router)
 *   world.sample(x, z)    → { biome, surfaceY, isWater, climate? }
 *   world.sampleGrid(...) → typed arrays, no per-sample objects
 *
 * Deliberately knows nothing about geography, constraints, or search.
 *
 * Two measured facts shape this file:
 *
 *  - Zeroing the router fields we never read (final_density, vein_*, barrier,
 *    fluid_level_*, lava) cuts RandomState construction from 44.6 to 12.7 ms
 *    per seed with BIT-IDENTICAL climate and initial-density output. The full
 *    router is built lazily, only if exact block-resolution height is asked for.
 *
 *  - Surface height comes from Minecraft's own preliminary-surface-level scan
 *    over `initial_density_without_jaggedness`. Terralith sets size_vertical=1,
 *    so cells are 4 blocks tall and a faithful scan costs ~72 evaluations and
 *    ~37 us per column. A hierarchical scan is only 2x faster and disagrees on
 *    ~0.25% of columns (Terralith's floating Skylands), so it is opt-in.
 */
import { Climate, DensityFunction, NoiseGeneratorSettings, NoiseSettings, RandomState } from 'deepslate';
import { PackStack } from './packs.mjs';
import { buildWorld } from './registry.mjs';
import { TagSet } from './tags.mjs';

export const FIELD = { BIOME: 1, SURFACE: 2, WATER: 4, CLIMATE: 8 };

/** Minecraft's NoiseRouterData threshold: first cell-aligned y from the top
 *  whose initial density (no jaggedness) exceeds this is the surface estimate. */
export const SURFACE_DENSITY_THRESHOLD = 0.390625;
export const NO_SURFACE = Number.MIN_SAFE_INTEGER;

/** Router fields the coarse pass actually reads. Everything else is zeroed. */
const COARSE_ROUTER_FIELDS = [
  'temperature', 'vegetation', 'continents', 'erosion', 'depth', 'ridges',
  'initial_density_without_jaggedness',
];

/**
 * Water classification strategies, measured against `exact` over 6000 points
 * on seed 857 with the Terralith + Continents stack:
 *
 *   mode         disagreement vs exact   cost/cell
 *   biome                  (different question)   ~20 us
 *   preliminary            10.22%                 ~78 us
 *   sea_level               1.22%                ~159 us
 *   auto (+-24)             0.72%                 ~50 us   <- default
 *   exact                   reference            ~813 us
 *
 * `preliminary` is systematically biased: the cell-resolution probe sits a
 * median 11 blocks BELOW the true surface, so near-shore land reads as water.
 * `auto` uses it only where the answer is unambiguous (more than `waterBand`
 * blocks from sea level) and falls back to a single final-density probe at sea
 * level in the band where it is not — which is both cheaper and far more
 * accurate than either alone.
 *
 * None of this is validated against the real game yet. See `validate-plan`.
 */
export const WATER_MODE = {
  /** biome is in #is_ocean / #is_river / #is_deep_ocean. No height scan: fastest. */
  BIOME: 'biome',
  /** preliminary surface level < sea level. Cheap, but biased toward water. */
  PRELIMINARY: 'preliminary',
  /** is the block AT sea level solid? One final-density evaluation. */
  SEA_LEVEL: 'sea_level',
  /** preliminary outside the shore band, sea-level probe inside it. Default. */
  AUTO: 'auto',
  /** exact final-density surface < sea level. Block-resolution, slowest. */
  EXACT: 'exact',
};

/** Half-width in blocks of the band around sea level where `auto` probes. */
export const DEFAULT_WATER_BAND = 24;

/** Which modes need the untrimmed router (i.e. final_density). */
export const needsFullRouter = (mode) =>
  mode === WATER_MODE.EXACT || mode === WATER_MODE.SEA_LEVEL || mode === WATER_MODE.AUTO;

const DEFAULT_WATER_BIOME_TAGS = ['#minecraft:is_ocean', '#minecraft:is_river', '#minecraft:is_deep_ocean'];

export class Evaluator {
  /**
   * @param {{minecraftVersion?:string, dimension?:string, mods?:string[],
   *          waterBiomes?:string[], surfaceScanTop?:number,
   *          datapacks: Array<string|{path:string,name?:string}>}} spec
   * @param {{packMode?:'worldgen'|'audit'|'full'}} [opts]
   */
  /**
   * Build from packs that are already in memory. This is the only entry point
   * the core has: *where* the bytes came from — Modrinth's CDN, a curated
   * bundle, a dragged-in File, or (in the CLI) the filesystem — is the host's
   * problem, never the evaluator's.
   *
   * @param {Array<{name:string, files:Map<string,Uint8Array>}>} packs
   *        ordered low -> high priority, vanilla first
   */
  static fromPacks(packs, spec = {}) {
    if (!packs?.length) throw new Error('no datapacks supplied — at least the vanilla data pack is required');
    const stack = new PackStack(packs);
    const world = buildWorld(stack, { dimension: spec.dimension, mods: spec.mods });
    return new Evaluator(spec, stack, world);
  }

  constructor(spec, stack, world) {
    this.spec = spec;
    this.stack = stack;
    this.world = world;
    this.tags = new TagSet(stack, 'worldgen/biome');
    this.seaLevel = world.seaLevel;
    this.notes = world.notes.slice();

    this.settingsFull = world.settings;
    this.settingsCoarse = trimRouter(world.settingsJson, COARSE_ROUTER_FIELDS);

    const w = this.tags.compile(spec.waterBiomes ?? DEFAULT_WATER_BIOME_TAGS);
    this.waterBiomes = w.set;
    if (w.unresolved.length) this.notes.push('water biome tags not found in the pack stack: ' + w.unresolved.join(', '));

    this.surfaceScanTop = spec.surfaceScanTop ?? (world.noiseShape.minY + world.noiseShape.height);
    this.waterBand = spec.waterBand ?? DEFAULT_WATER_BAND;
  }

  /** Report for `seedtool inspect` and for logging what was actually loaded. */
  describe() {
    return {
      packs: this.stack.packs.map(p => ({ name: p.name, kind: p.kind, files: p.files.size, source: p.source })),
      dimension: this.world.dimension,
      seaLevel: this.seaLevel,
      noiseShape: this.world.noiseShape,
      cellWidth: NoiseSettings.cellWidth(this.world.noiseShape),
      cellHeight: NoiseSettings.cellHeight(this.world.noiseShape),
      counts: this.world.stats,
      biomes: { entries: this.world.biomeList.count, distinct: this.world.biomeList.biomeCount },
      waterBiomes: this.waterBiomes.size,
      provenance: this.world.provenance,
      notes: this.notes,
    };
  }

  /**
   * @param {bigint|number|string} seed
   * @param {{router?:'coarse'|'full'}} [opts]
   */
  forSeed(seed, opts = {}) { return new SeededWorld(this, BigInt(seed), opts.router ?? 'coarse'); }
}

export class SeededWorld {
  constructor(evaluator, seed, routerMode) {
    const w = evaluator.world;
    this.evaluator = evaluator;
    this.seed = seed;
    this.seaLevel = w.seaLevel;
    this.routerMode = routerMode;

    this.cellWidth = NoiseSettings.cellWidth(w.noiseShape);
    this.cellHeight = NoiseSettings.cellHeight(w.noiseShape);
    this.minY = w.noiseShape.minY;
    this.maxY = w.noiseShape.minY + w.noiseShape.height;
    this.scanTop = Math.min(evaluator.surfaceScanTop, this.maxY);

    const settings = routerMode === 'full' ? evaluator.settingsFull : evaluator.settingsCoarse;
    this.randomState = new RandomState(settings, seed);
    this.sampler = this.randomState.sampler;
    this.biomeSource = w.biomeSource;

    // deepslate 0.25 reads `preliminary_surface_level` from the router JSON, but
    // the real field is `initial_density_without_jaggedness`, so
    // randomState.router.preliminarySurfaceLevel is a dud. Build it ourselves,
    // through the same visitor RandomState uses for the rest of the router.
    const visitor = this.randomState.createVisitor(w.noiseShape, w.settings.legacyRandomSource);
    this.initialDensity = w.initialDensityJson !== undefined
      ? DensityFunction.fromJson(w.initialDensityJson).mapAll(visitor)
      : this.randomState.router.finalDensity;

    this._full = routerMode === 'full' ? this.randomState : null;
  }

  /** final_density needs the untrimmed router; build it on first use only. */
  get finalDensity() {
    if (!this._full) this._full = new RandomState(this.evaluator.settingsFull, this.seed);
    return this._full.router.finalDensity;
  }

  /**
   * Minecraft's NoiseRouterData.computePreliminarySurfaceLevel: the highest
   * cell-aligned y whose initial density clears the threshold. Cell resolution.
   * @returns {number} y, or NO_SURFACE if the column never becomes solid
   */
  preliminarySurfaceLevel(x, z) {
    const ctx = { x, y: 0, z };
    const d = this.initialDensity;
    for (let y = this.scanTop; y >= this.minY; y -= this.cellHeight) {
      ctx.y = y;
      if (d.compute(ctx) > SURFACE_DENSITY_THRESHOLD) return y;
    }
    return NO_SURFACE;
  }

  /**
   * Block-resolution surface: bracket with the cheap probe, then walk down
   * through final_density — the function the chunk generator itself uses to
   * decide solid vs air. The bracket is +-32 because the measured spread of
   * (exact - preliminary) over this pack stack is [-25, +21].
   */
  exactSurfaceLevel(x, z) {
    const coarse = this.preliminarySurfaceLevel(x, z);
    if (coarse === NO_SURFACE) return NO_SURFACE;
    const fd = this.finalDensity;
    const top = Math.min(this.maxY - 1, coarse + 32);
    const bottom = Math.max(this.minY, coarse - 32);
    const ctx = { x, y: 0, z };
    for (let y = top; y >= bottom; y--) {
      ctx.y = y;
      if (fd.compute(ctx) > 0) return y;
    }
    return coarse; // nothing solid in the bracket — fall back to the cell estimate
  }

  /** Is the block at sea level solid? One final-density evaluation. */
  solidAtSeaLevel(x, z) {
    return this.finalDensity.compute({ x, y: this.seaLevel, z }) > 0;
  }

  /**
   * The default land/water call. Trusts the cheap scan only where it cannot be
   * wrong — more than `waterBand` blocks clear of sea level — and pays for a
   * final-density probe inside the shore band, where every coastline lives.
   * @returns {boolean} true if water
   */
  isWaterAt(x, z, mode = WATER_MODE.AUTO, biomeId = undefined) {
    switch (mode) {
      case WATER_MODE.BIOME:
        return this.evaluator.waterBiomes.has(biomeId ?? this.sample(x, z, { height: 'none' }).biome);
      case WATER_MODE.SEA_LEVEL:
        return !this.solidAtSeaLevel(x, z);
      case WATER_MODE.EXACT: {
        const y = this.exactSurfaceLevel(x, z);
        return y === NO_SURFACE || y < this.seaLevel;
      }
      case WATER_MODE.PRELIMINARY: {
        const y = this.preliminarySurfaceLevel(x, z);
        return y === NO_SURFACE || y < this.seaLevel;
      }
      case WATER_MODE.AUTO:
      default: {
        const y = this.preliminarySurfaceLevel(x, z);
        if (y === NO_SURFACE) return true;
        const band = this.evaluator.waterBand;
        if (y >= this.seaLevel + band) return false;
        if (y <= this.seaLevel - band) return true;
        return !this.solidAtSeaLevel(x, z);
      }
    }
  }

  /**
   * @param {number} x block x
   * @param {number} z block z
   * @param {{climate?:boolean, height?:'preliminary'|'exact'|'none',
   *          water?:'biome'|'preliminary'|'exact'}} [opts]
   */
  sample(x, z, opts = {}) {
    const waterMode = opts.water ?? WATER_MODE.AUTO;
    const height = opts.height ?? (waterMode === WATER_MODE.EXACT ? 'exact'
      : waterMode === WATER_MODE.BIOME ? 'none' : 'preliminary');

    let surfaceY = NO_SURFACE;
    if (height === 'exact') surfaceY = this.exactSurfaceLevel(x, z);
    else if (height === 'preliminary') surfaceY = this.preliminarySurfaceLevel(x, z);

    const qx = x >> 2, qz = z >> 2;
    const qy = surfaceY === NO_SURFACE ? this.seaLevel >> 2 : surfaceY >> 2;
    const biome = this.biomeSource.getBiome(qx, qy, qz, this.sampler).toString();

    const out = {
      biome,
      surfaceY: surfaceY === NO_SURFACE ? null : surfaceY,
      isWater: this.isWaterAt(x, z, waterMode, biome),
    };
    if (opts.climate) {
      const c = this.sampler.sample(qx, qy, qz);
      out.climate = {
        temperature: c.temperature, humidity: c.humidity,
        continentalness: c.continentalness, erosion: c.erosion,
        depth: c.depth, weirdness: c.weirdness,
      };
    }
    return out;
  }

  /**
   * Bulk path. Returns typed arrays — at 16k+ samples per seed, per-sample
   * object allocation is the difference between usable and not (report §6).
   *
   * @param {number} x0 @param {number} z0 world coords of cell (0,0)
   * @param {number} nx @param {number} nz cell counts
   * @param {number} step blocks between cells
   * @param {number} fields bitmask of FIELD.*
   * @param {{water?:'biome'|'preliminary'|'exact'}} [opts]
   */
  sampleGrid(x0, z0, nx, nz, step, fields = FIELD.BIOME | FIELD.WATER, opts = {}) {
    const n = nx * nz;
    const waterMode = opts.water ?? WATER_MODE.AUTO;
    const wantWater = !!(fields & FIELD.WATER);
    const wantBiome = !!(fields & FIELD.BIOME) || (wantWater && waterMode === WATER_MODE.BIOME);
    const wantSurface = !!(fields & FIELD.SURFACE)
      || (wantWater && waterMode !== WATER_MODE.BIOME && waterMode !== WATER_MODE.SEA_LEVEL);
    const wantClimate = !!(fields & FIELD.CLIMATE);
    const exact = waterMode === WATER_MODE.EXACT;
    const band = this.evaluator.waterBand;

    const res = { x0, z0, nx, nz, step, seaLevel: this.seaLevel, waterMode };
    const biomePalette = [];
    const biomeIndex = new Map();
    if (wantBiome) res.biome = new Uint16Array(n);
    if (wantSurface) res.surfaceY = new Int16Array(n);
    if (wantWater) res.water = new Uint8Array(n);
    if (wantClimate) {
      res.temperature = new Float32Array(n); res.humidity = new Float32Array(n);
      res.continentalness = new Float32Array(n); res.erosion = new Float32Array(n);
      res.depth = new Float32Array(n); res.weirdness = new Float32Array(n);
    }

    const waterSet = this.evaluator.waterBiomes;
    let i = 0;
    for (let jz = 0; jz < nz; jz++) {
      const z = z0 + jz * step;
      const qz = z >> 2;
      for (let jx = 0; jx < nx; jx++, i++) {
        const x = x0 + jx * step;
        const qx = x >> 2;

        let qy = this.seaLevel >> 2;
        let solid = false, y = 0;
        if (wantSurface) {
          y = exact ? this.exactSurfaceLevel(x, z) : this.preliminarySurfaceLevel(x, z);
          solid = y !== NO_SURFACE;
          res.surfaceY[i] = solid ? y : this.minY;
          if (solid) qy = y >> 2;
        }

        let biomeId;
        if (wantBiome) {
          biomeId = this.biomeSource.getBiome(qx, qy, qz, this.sampler).toString();
          let k = biomeIndex.get(biomeId);
          if (k === undefined) { k = biomePalette.length; biomePalette.push(biomeId); biomeIndex.set(biomeId, k); }
          res.biome[i] = k;
        }
        if (wantWater) {
          let isWater;
          if (waterMode === WATER_MODE.BIOME) isWater = waterSet.has(biomeId);
          else if (waterMode === WATER_MODE.SEA_LEVEL) isWater = !this.solidAtSeaLevel(x, z);
          else if (waterMode === WATER_MODE.AUTO) {
            if (!solid) isWater = true;
            else if (y >= this.seaLevel + band) isWater = false;
            else if (y <= this.seaLevel - band) isWater = true;
            else isWater = !this.solidAtSeaLevel(x, z);
          } else isWater = !solid || y < this.seaLevel;
          res.water[i] = isWater ? 1 : 0;
        }
        if (wantClimate) {
          const c = this.sampler.sample(qx, qy, qz);
          res.temperature[i] = c.temperature; res.humidity[i] = c.humidity;
          res.continentalness[i] = c.continentalness; res.erosion[i] = c.erosion;
          res.depth[i] = c.depth; res.weirdness[i] = c.weirdness;
        }
      }
    }
    res.biomePalette = biomePalette;
    return res;
  }
}

/** Replace unread router fields with constant 0. Verified bit-identical for
 *  climate and initial_density over 300 points; 3.5x faster to construct. */
export function trimRouter(settingsJson, keep) {
  const router = {};
  for (const k of Object.keys(settingsJson.noise_router ?? {})) {
    router[k] = keep.includes(k) ? settingsJson.noise_router[k] : 0;
  }
  return NoiseGeneratorSettings.fromJson({ ...settingsJson, noise_router: router });
}

export { COARSE_ROUTER_FIELDS };
