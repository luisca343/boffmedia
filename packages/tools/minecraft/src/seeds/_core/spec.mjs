/**
 * spec.mjs — load, validate and run a §8 seed spec against one seed.
 *
 * A spec has three parts:
 *   world   which datapacks, which version   -> Evaluator.load
 *   scan    how wide and how finely to look  -> sampleGrid
 *   locations   named sites, each either pinned (`at`) or discovered
 *               (`discover`), each with hard constraints and soft score terms
 *
 * Locations resolve in declaration order, so a later location may reference an
 * earlier one (`land_connected_to`).
 */
import { Evaluator, FIELD, needsFullRouter, WATER_MODE } from './evaluator.mjs';
import { Geography, landMaskFrom } from './geography.mjs';
import { CONSTRAINTS, directionVector, evaluate, SCORERS } from './constraints.mjs';

/**
 * Parse a spec from text. JSONC-ish: `//` line comments are stripped, because
 * the annotated example spec relies on them.
 */
export function parseSpec(text, label = 'spec') {
  let spec;
  try { spec = JSON.parse(text.replace(/^\s*\/\/.*$/gm, '')); }
  catch (e) { throw new Error('Could not parse ' + label + ': ' + e.message); }
  validateSpec(spec);
  return spec;
}

export function validateSpec(spec) {
  const errs = [];
  if (!spec.world?.datapacks?.length) errs.push('world.datapacks must list at least the vanilla data pack');
  if (!spec.locations || !Object.keys(spec.locations).length) errs.push('locations must define at least one site');
  const scan = spec.scan ?? {};
  if (scan.radius !== undefined && scan.radius <= 0) errs.push('scan.radius must be positive');
  for (const [name, loc] of Object.entries(spec.locations ?? {})) {
    if (!loc.at && !loc.discover) errs.push('location "' + name + '" needs either `at` or `discover`');
    for (const c of loc.constraints ?? []) {
      if (!CONSTRAINTS[c.type]) errs.push('location "' + name + '": unknown constraint type "' + c.type + '"');
    }
    for (const s of loc.score ?? []) {
      if (!SCORERS[s.type]) errs.push('location "' + name + '": no scorer for "' + s.type + '"');
    }
  }
  if (errs.length) throw new Error('Invalid spec:\n  - ' + errs.join('\n  - '));
  return true;
}

/**
 * Build the evaluator a spec asks for, from packs the host has already
 * fetched. The spec names packs; resolving those names to bytes is the host's
 * job (see `_lib/packSource.ts`), so this stays free of any filesystem or
 * network notion.
 *
 * @param {object} spec
 * @param {Array<{name:string, files:Map<string,Uint8Array>}>} packs
 *        ordered low -> high priority, vanilla first
 */
export function evaluatorFor(spec, packs) {
  const world = spec.world ?? {};
  return Evaluator.fromPacks(packs, {
    minecraftVersion: world.minecraft_version,
    dimension: world.dimension,
    mods: world.mods,
    waterBiomes: world.water_biomes,
    surfaceScanTop: world.surface_scan_top,
    waterBand: world.water_band,
  });
}

export function scanConfig(spec) {
  const s = spec.scan ?? {};
  return {
    radius: s.radius ?? 20000,
    coarseStep: s.coarse_step ?? 128,
    fineStep: s.fine_step ?? 16,
    water: s.water_mode ?? WATER_MODE.AUTO,
    origin: [spec.origin?.x ?? 0, spec.origin?.z ?? 0],
  };
}

/**
 * Evaluate one seed. Returns a full report: per-location pass/fail, the
 * constraint values behind each verdict, and an overall score.
 *
 * @param {Evaluator} ev
 * @param {object} spec
 * @param {bigint} seed
 * @param {{grid?:object}} [reuse]
 */
export function evaluateSeed(ev, spec, seed, reuse = {}) {
  const cfg = scanConfig(spec);
  const world = reuse.world
    ?? ev.forSeed(seed, { router: needsFullRouter(cfg.water) ? 'full' : 'coarse' });

  const n = Math.floor((cfg.radius * 2) / cfg.coarseStep) + 1;
  const x0 = cfg.origin[0] - cfg.radius, z0 = cfg.origin[1] - cfg.radius;
  const grid = reuse.grid ?? world.sampleGrid(
    x0, z0, n, n, cfg.coarseStep,
    FIELD.BIOME | FIELD.WATER | FIELD.SURFACE, { water: cfg.water });

  const mask = landMaskFrom(grid);
  const geo = reuse.geo ?? Geography.analyse(mask);

  /** @type {Map<string, [number,number]>} */
  const resolved = new Map();
  // Fine grids depend on where a SITE is, not on constraint thresholds, so a
  // caller tuning a spec against one seed should pass a persistent cache in.
  // Without it every re-evaluation rebuilds them at ~100 ms each.
  const fineCache = reuse.fineGrids ?? new Map();
  const ctx = {
    grid, mask, geo, world, tags: ev.tags, memo: new Map(),
    x: 0, z: 0, siteOf: (nm) => resolved.get(nm),
    /** Local high-resolution resample around the current site (report §10). */
    fineGrid: (radius) => {
      const key = ctx.x + ':' + ctx.z + ':' + radius;
      let g = fineCache.get(key);
      if (!g) {
        const step = cfg.fineStep;
        const n = Math.floor((radius * 2) / step) + 1;
        g = world.sampleGrid(ctx.x - radius, ctx.z - radius, n, n, step,
          FIELD.SURFACE | FIELD.WATER, { water: cfg.water });
        fineCache.set(key, g);
      }
      return g;
    },
  };

  const locations = {};
  let totalScore = 0, totalWeight = 0, allHardPass = true;

  for (const [name, loc] of Object.entries(spec.locations)) {
    const all = loc.constraints ?? [];
    const coarseC = all.filter(c => !c.fine);
    const fineC = all.filter(c => c.fine);
    const candidates = candidateSites(loc, cfg, grid);
    let best = null;

    // Phase A — coarse. Every candidate, cheap constraints only.
    for (const [cx, cz] of candidates) {
      ctx.x = cx; ctx.z = cz;
      const results = coarseC.map(c => evaluate(ctx, c));
      const pass = results.every(r => r.pass);
      const score = scoreOf(loc, results);
      if (!best || (pass && !best.pass) || ((pass === best.pass) && score > best.score)) {
        best = { x: cx, z: cz, pass, score, results };
      }
      if (pass && loc.discover === undefined) break; // pinned site: one shot
    }

    if (!best) best = { x: cfg.origin[0], z: cfg.origin[1], pass: false, score: 0, results: [] };

    // Phase B — fine. Only the winner pays for a local high-resolution resample.
    if (fineC.length && best.pass) {
      ctx.x = best.x; ctx.z = best.z;
      const fineResults = fineC.map(c => evaluate(ctx, c));
      best.results = best.results.concat(fineResults);
      best.pass = best.results.every(r => r.pass);
      best.score = scoreOf(loc, best.results);
    } else if (fineC.length) {
      best.results = best.results.concat(fineC.map(c => ({ type: c.type, pass: false, value: 0, detail: 'not evaluated — coarse phase already failed' })));
      best.pass = false;
      best.score = 0; // an unmeasured site does not get to look good
    }
    resolved.set(name, [best.x, best.z]);

    const hard = loc.hard !== false;
    if (hard && !best.pass) allHardPass = false;
    const weight = hard ? 1 : (loc.weight ?? 0.5);
    totalScore += best.score * weight;
    totalWeight += weight;

    locations[name] = {
      x: best.x, z: best.z, hard, pass: best.pass, score: round4(best.score),
      candidatesTried: candidates.length,
      constraints: best.results.map(r => ({
        type: r.type, pass: r.pass, value: round4(r.value), detail: r.detail,
      })),
    };
  }

  return {
    seed: seed.toString(),
    pass: allHardPass,
    score: round4(totalWeight ? totalScore / totalWeight : 0),
    locations,
    scan: { radius: cfg.radius, step: cfg.coarseStep, cells: n * n, waterMode: cfg.water },
    geography: {
      waterBodies: geo.waterBodies().length,
      landMasses: geo.landMasses().length,
      largestWaterArea: geo.waterBodies()[0]?.areaBlocks ?? 0,
      largestLandArea: geo.landMasses()[0]?.areaBlocks ?? 0,
    },
  };
}

/**
 * A tuning session: everything that depends on (packs, seed, scan) but NOT on
 * your constraints, computed once and held.
 *
 * This is the shape an interactive UI wants. The expensive work — RandomState,
 * the coarse grid, connected components, and any fine grids — is independent of
 * constraint thresholds, so dragging a slider only re-runs the constraint
 * vocabulary over cached arrays.
 *
 *   const s = new Session(ev, spec, 857n);
 *   s.evaluate();                    // first call pays for the grid
 *   spec.locations.spawn.constraints[0].within = 600;
 *   s.evaluate();                    // milliseconds
 *
 * Invalidate by constructing a new Session when the seed, the pack stack, or
 * anything under `scan` changes.
 */
export class Session {
  constructor(ev, spec, seed) {
    this.ev = ev;
    this.spec = spec;
    this.seed = BigInt(seed);
    this.cfg = scanConfig(spec);
    this.fineGrids = new Map();
    this.world = null;
    this.grid = null;
    this.geo = null;
  }

  /** Build the seed-dependent, constraint-independent state. Idempotent. */
  warm() {
    if (this.grid) return this;
    const cfg = this.cfg;
    this.world = this.ev.forSeed(this.seed, { router: needsFullRouter(cfg.water) ? 'full' : 'coarse' });
    const n = Math.floor((cfg.radius * 2) / cfg.coarseStep) + 1;
    this.grid = this.world.sampleGrid(
      cfg.origin[0] - cfg.radius, cfg.origin[1] - cfg.radius, n, n, cfg.coarseStep,
      FIELD.BIOME | FIELD.WATER | FIELD.SURFACE, { water: cfg.water });
    this.geo = Geography.analyse(landMaskFrom(this.grid));
    return this;
  }

  /** Re-run the spec against the cached world. Cheap after the first call. */
  evaluate(spec = this.spec) {
    this.warm();
    return evaluateSeed(this.ev, spec, this.seed, {
      world: this.world, grid: this.grid, geo: this.geo, fineGrids: this.fineGrids,
    });
  }
}

/**
 * Level-1 filter (report §10). The whole point is that it never touches the
 * surface-height scan: with water_mode "biome" a cell costs one biome lookup
 * (~20 us) instead of ~72 density evaluations (~37 us + biome). A small grid
 * around the origin therefore rejects most seeds for roughly the cost of
 * RandomState itself.
 *
 * Returns { pass, skipped } — `skipped` when the spec declares no prefilter.
 */
export function prefilterSeed(ev, spec, seed, world) {
  const pf = spec.scan?.prefilter;
  if (!pf) return { pass: true, skipped: true };

  const cfg = scanConfig(spec);
  const radius = pf.radius ?? 1500;
  const step = pf.step ?? 64;
  const waterMode = pf.water_mode ?? WATER_MODE.BIOME;
  const names = pf.locations ?? Object.keys(spec.locations).filter(k => spec.locations[k].hard !== false);

  const w = world ?? ev.forSeed(seed, { router: needsFullRouter(waterMode) ? 'full' : 'coarse' });
  const n = Math.floor((radius * 2) / step) + 1;
  const fields = FIELD.BIOME | FIELD.WATER | (waterMode === WATER_MODE.BIOME ? 0 : FIELD.SURFACE);
  const grid = w.sampleGrid(cfg.origin[0] - radius, cfg.origin[1] - radius, n, n, step, fields, { water: waterMode });

  const mask = landMaskFrom(grid);
  const geo = Geography.analyse(mask);
  const ctx = { grid, mask, geo, world: w, tags: ev.tags, memo: new Map(), x: 0, z: 0, siteOf: () => undefined };

  for (const name of names) {
    const loc = spec.locations[name];
    if (!loc) continue;
    const only = new Set(pf.constraints ?? []);
    const cs = (loc.constraints ?? []).filter(c => (only.size ? only.has(c.type) : PREFILTER_SAFE.has(c.type)));
    if (!cs.length) continue;

    const candidates = candidateSites(loc, { ...cfg, radius }, grid)
      .filter(([x, z]) => Math.abs(x - cfg.origin[0]) <= radius && Math.abs(z - cfg.origin[1]) <= radius);
    if (!candidates.length) continue;

    let any = false;
    for (const [cx, cz] of candidates) {
      ctx.x = cx; ctx.z = cz;
      if (cs.every(c => evaluate(ctx, c).pass)) { any = true; break; }
    }
    if (!any) return { pass: false, skipped: false, failed: name };
  }
  return { pass: true, skipped: false };
}

/** Constraints that are meaningful inside a small window with no height data. */
const PREFILTER_SAFE = new Set(['biome_within', 'land_at', 'island_feel', 'coastline', 'buildable_area']);

/** Where to look for a location: a pinned ring, or a discovery band. */
function candidateSites(loc, cfg, grid) {
  const out = [];
  if (loc.at) {
    const { x = 0, z = 0, tolerance = 0 } = loc.at;
    out.push([x, z]);
    if (tolerance > 0) {
      const step = Math.max(grid.step, Math.round(tolerance / 4));
      for (let r = step; r <= tolerance; r += step) {
        for (let a = 0; a < 8; a++) {
          const th = (a / 8) * Math.PI * 2;
          out.push([Math.round(x + Math.cos(th) * r), Math.round(z + Math.sin(th) * r)]);
        }
      }
    }
    return out;
  }

  const d = loc.discover ?? {};
  const dmin = d.distance?.min ?? 0, dmax = d.distance?.max ?? cfg.radius;
  const step = d.step ?? Math.max(grid.step, Math.round((dmax - dmin) / 6) || grid.step);
  const dir = directionVector(d.direction);
  const [ox, oz] = cfg.origin;

  if (dir) {
    const len = Math.hypot(dir[0], dir[1]);
    const ux = dir[0] / len, uz = dir[1] / len;
    const px = -uz, pz = ux; // perpendicular
    const lat = d.x_range ? [d.x_range[0], d.x_range[1]] : [-2000, 2000];
    for (let r = dmin; r <= dmax; r += step) {
      for (let t = lat[0]; t <= lat[1]; t += step) {
        out.push([Math.round(ox + ux * r + px * t), Math.round(oz + uz * r + pz * t)]);
      }
    }
  } else {
    for (let r = Math.max(step, dmin); r <= dmax; r += step) {
      const circumference = 2 * Math.PI * r;
      const count = Math.max(8, Math.round(circumference / step));
      for (let a = 0; a < count; a++) {
        const th = (a / count) * Math.PI * 2;
        out.push([Math.round(ox + Math.cos(th) * r), Math.round(oz + Math.sin(th) * r)]);
      }
    }
  }
  return out;
}

function scoreOf(loc, results) {
  const terms = loc.score ?? [];
  if (!terms.length) return results.length && results.every(r => r.pass) ? 1 : 0;
  let sum = 0, wsum = 0;
  for (const t of terms) {
    const r = results.find(x => x.type === t.type);
    if (!r) continue;
    const fn = SCORERS[t.type];
    const w = t.weight ?? 1;
    sum += fn(r.value, t) * w;
    wsum += w;
  }
  return wsum ? sum / wsum : 0;
}

const round4 = (v) => (Number.isFinite(v) ? Math.round(v * 10000) / 10000 : (v > 0 ? 1e9 : -1e9));
