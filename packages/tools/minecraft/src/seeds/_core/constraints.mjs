/**
 * constraints.mjs — the constraint + scoring vocabulary behind the §8 JSON.
 *
 * Every constraint is a pure function of (context, config) returning
 *   { pass: boolean, value: number, detail: string }
 * so the same implementation serves both the hard gate and the soft score.
 * No implementation names leak into the JSON: constraints describe world
 * properties, not how we compute them.
 */
import {
  buildableArea, coastlineLength, distanceField, distanceToComponent,
  fieldDistanceTo, nearestBiome, terrainRoughness, waterFraction, worldToCell,
  inBounds,
} from './geography.mjs';

/**
 * @typedef {object} Ctx
 * @property {object} grid    sampleGrid result (biome/surfaceY/water/palette)
 * @property {object} mask    LandMask over the same cells
 * @property {import('./geography.mjs').Geography} geo
 * @property {object} world   SeededWorld
 * @property {import('./tags.mjs').TagSet} tags
 * @property {number} x @property {number} z   the site under test
 * @property {Map<string,any>} memo
 */

const ok = (pass, value, detail) => ({ pass, value, detail });

/**
 * A dependency failure: the referenced location did not resolve (or, with
 * placement gating on, did not place). Marked so attrition can file it under
 * the location that actually failed rather than under this constraint.
 */
const blocked = (value, detail) => ({ pass: false, value, detail, blocked: true });

/**
 * Resolve a named location this constraint depends on. Legacy engines see
 * every resolved location (even ones that failed — the pre-gating behaviour,
 * kept for bit-parity); engines with placement gating only see placed ones,
 * so a phantom capital cannot anchor a measurement.
 */
const refSite = (ctx, name) => (ctx.refSite ? ctx.refSite(name) : ctx.siteOf?.(name));

/**
 * Soft-band scoring with linear interpolation.
 *
 * Returns score in [0, 1] based on value and band thresholds:
 * - Hard fail (score=0, pass=false) if value < min or value > max
 * - Hard success (score=1, pass=true) if min <= value <= max
 * - Linear interpolation between (min, ideal) and (ideal_max, max)
 *
 * For a single-peak band (no ideal_max):
 *   score = 1 if ideal <= value <= (ideal_max or Infinity)
 *   score = (value - min) / (ideal - min) if min <= value < ideal
 *
 * For a dual-band (ideal_max defined):
 *   score = 1 if ideal <= value <= ideal_max
 *   score = (value - min) / (ideal - min) if min <= value < ideal
 *   score = (max - value) / (max - ideal_max) if ideal_max < value <= max
 *
 * @param {number} value The measured value
 * @param {object} band { min?, ideal?, ideal_max?, max? }
 * @returns {number} Score in [0, 1], or NaN if no band defined
 */
function softBandScore(value, band) {
  if (!band) return NaN;
  const { min, ideal, ideal_max, max } = band;

  // Hard fail outside bounds
  if (min !== undefined && value < min) return 0;
  if (max !== undefined && value > max) return 0;

  // Single-peak band: score is 1 from ideal to ideal_max (or infinity if no ideal_max)
  if (ideal !== undefined && ideal_max === undefined) {
    if (value >= ideal) return 1;
    if (min !== undefined && min < ideal) {
      return (value - min) / (ideal - min);
    }
    return value > 0 ? 1 : 0;
  }

  // Dual-band: plateaus from ideal to ideal_max, slopes beyond
  if (ideal !== undefined && ideal_max !== undefined) {
    if (value >= ideal && value <= ideal_max) return 1;
    if (value < ideal && min !== undefined) {
      return (value - min) / (ideal - min);
    }
    if (value > ideal_max && max !== undefined) {
      return (max - value) / (max - ideal_max);
    }
    return 0.5; // fallback for edge cases
  }

  // No band defined
  return NaN;
}

/** Palette indices whose biome id matches a selector list. */
function biomeIdxSet(ctx, selectors) {
  const key = 'bidx:' + selectors.join('|');
  let s = ctx.memo.get(key);
  if (s) return s;
  s = new Set();
  ctx.grid.biomePalette.forEach((id, i) => { if (ctx.tags.matches(id, selectors)) s.add(i); });
  ctx.memo.set(key, s);
  return s;
}

export const CONSTRAINTS = {
  /** Dry land within `within` blocks of the site. */
  land_at: (ctx, c) => {
    const within = c.within ?? 0;
    const [jx, jz] = worldToCell(ctx.mask, ctx.x, ctx.z);
    if (!inBounds(ctx.mask, jx, jz)) return ok(false, 0, 'outside scan window');
    if (!ctx.mask.water[jz * ctx.mask.nx + jx]) return ok(true, 0, 'land at site');
    const r = Math.max(1, Math.round(within / ctx.mask.step));
    for (let rr = 1; rr <= r; rr++) {
      for (let dz = -rr; dz <= rr; dz++) for (let dx = -rr; dx <= rr; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== rr) continue;
        const ax = jx + dx, az = jz + dz;
        if (!inBounds(ctx.mask, ax, az)) continue;
        if (!ctx.mask.water[az * ctx.mask.nx + ax]) {
          const d = Math.hypot(dx, dz) * ctx.mask.step;
          return ok(d <= within, d, 'nearest land ' + Math.round(d) + ' blocks');
        }
      }
    }
    return ok(false, Infinity, 'no land within ' + within);
  },

  /** A biome from `biomes` (tags allowed) within `within` blocks. */
  biome_within: (ctx, c) => {
    const idx = biomeIdxSet(ctx, c.biomes ?? []);
    if (!idx.size) return ok(false, Infinity, 'no biome in the scan window matches ' + (c.biomes ?? []).join(','));
    const hit = nearestBiome(ctx.grid, ctx.x, ctx.z, idx, c.within);
    if (!hit) return ok(false, Infinity, 'none within ' + c.within);
    if (c.require_any?.length) {
      const req = biomeIdxSet(ctx, c.require_any);
      const hit2 = nearestBiome(ctx.grid, ctx.x, ctx.z, req, c.within);
      if (!hit2) return ok(false, Infinity, 'required ' + c.require_any.join(',') + ' absent within ' + c.within);
      return ok(true, hit2[2], 'required biome at ' + Math.round(hit2[2]) + ' blocks');
    }
    return ok(true, hit[2], 'nearest match ' + Math.round(hit[2]) + ' blocks');
  },

  /** Contiguous land around the site, in blocks^2. */
  buildable_area: (ctx, c) => {
    const a = buildableArea(ctx.mask, ctx.x, ctx.z, c.radius ?? 1500, ctx.geo);
    return ok(a >= (c.minimum ?? 0) && a <= (c.maximum ?? Infinity), a, Math.round(a) + ' blocks^2');
  },

  /** Coastline length within a radius, in blocks. */
  coastline: (ctx, c) => {
    const l = coastlineLength(ctx.mask, ctx.x, ctx.z, c.radius ?? 1000);
    return ok(l >= (c.minimum ?? 0) && l <= (c.maximum ?? Infinity), l, Math.round(l) + ' blocks of coast');
  },

  /**
   * The report §8 "island feel" resolution: a spawn ringed by water, expressed
   * as water fraction + coastline density instead of a landmass-area cap that
   * would forbid walking to the cities.
   */
  island_feel: (ctx, c) => {
    const radius = c.radius ?? 800;
    const wf = waterFraction(ctx.mask, ctx.x, ctx.z, radius);
    const cl = coastlineLength(ctx.mask, ctx.x, ctx.z, radius);
    const minWF = c.min_water_fraction ?? 0.35, maxWF = c.max_water_fraction ?? 0.9;
    const minCL = c.min_coastline ?? 0;
    const pass = wf >= minWF && wf <= maxWF && cl >= minCL;
    return ok(pass, wf, (wf * 100).toFixed(0) + '% water, ' + Math.round(cl) + ' blocks coast within ' + radius);
  },

  /** Hard landmass cap — kept because the report offered it; prefer island_feel. */
  landmass_area: (ctx, c) => {
    const id = ctx.geo.bodyAt(ctx.x, ctx.z);
    const comp = ctx.geo.component(id);
    if (!comp || comp.kind !== 'land') return ok(false, 0, 'site is not on land');
    const a = comp.areaBlocks;
    const truncated = comp.touchesEdge;
    const pass = a >= (c.minimum ?? 0) && a <= (c.maximum ?? Infinity) && !(truncated && c.maximum !== undefined);
    return ok(pass, a, Math.round(a) + ' blocks^2' + (truncated ? ' (TRUNCATED by scan window — lower bound)' : ''));
  },

  /**
   * A water body of at least `minimum_area` that the site touches (or that lies
   * within `within` blocks). `touchesEdge` bodies report a lower bound, so a
   * minimum-area test on them is sound; a maximum-area test is not.
   */
  large_connected_ocean: (ctx, c) => {
    const within = c.within ?? 1200;
    const [jx, jz] = worldToCell(ctx.mask, ctx.x, ctx.z);
    const r = Math.max(1, Math.round(within / ctx.mask.step));
    let best = null;
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r * r) continue;
      const ax = jx + dx, az = jz + dz;
      if (!inBounds(ctx.mask, ax, az)) continue;
      const i = az * ctx.mask.nx + ax;
      if (!ctx.mask.water[i]) continue;
      const comp = ctx.geo.components[ctx.geo.comp[i]];
      if (!best || comp.areaBlocks > best.areaBlocks) best = comp;
    }
    if (!best) return ok(false, 0, 'no water within ' + within);

    if (c.direction_bias) {
      // Which way does this ocean actually LIE from the site? A huge body wraps
      // around, so its component anchor says nothing — take the mean offset of
      // its cells inside the search window instead.
      let sx = 0, sz = 0, cnt = 0;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dz * dz > r * r) continue;
        const ax = jx + dx, az = jz + dz;
        if (!inBounds(ctx.mask, ax, az)) continue;
        const i = az * ctx.mask.nx + ax;
        if (ctx.geo.comp[i] !== best.id) continue;
        sx += dx; sz += dz; cnt++;
      }
      if (!cnt) return ok(false, best.areaBlocks, 'no cells of that ocean within ' + within);
      const target = [ctx.x + (sx / cnt) * ctx.mask.step, ctx.z + (sz / cnt) * ctx.mask.step];
      if (!directionOk(ctx, target, c.direction_bias)) {
        return ok(false, best.areaBlocks, 'ocean lies ' + bearing(ctx, target) + ', not ' + c.direction_bias);
      }
    }
    return ok(best.areaBlocks >= (c.minimum_area ?? 0), best.areaBlocks,
      Math.round(best.areaBlocks) + ' blocks^2' + (best.touchesEdge ? ' (lower bound)' : ''));
  },

  /** Both sites sit on the same land component — walkable without a boat. */
  land_connected_to: (ctx, c) => {
    const other = refSite(ctx, c.location);
    if (!other) return blocked(0, 'location "' + c.location + '" not resolved');
    const r = ctx.geo.reachableByLand([ctx.x, ctx.z], other);
    return ok(r, r ? 1 : 0, r ? 'same landmass' : 'different landmasses');
  },

  /**
   * Pairwise distance to all already-resolved sites (separation constraint).
   * Measures minimum Euclidean distance in blocks.
   */
  separation: (ctx, c) => {
    const resolved = ctx.resolvedSites ?? [];
    if (resolved.length === 0) return ok(true, Infinity, 'no resolved sites yet');
    let minDist = Infinity;
    for (const [x, z] of resolved) {
      const d = Math.hypot(ctx.x - x, ctx.z - z);
      if (d < minDist) minDist = d;
    }
    const min = c.minimum ?? 0;
    const pass = minDist >= min;
    return ok(pass, minDist, 'nearest resolved site ' + Math.round(minDist) + ' blocks');
  },

  /**
   * Distance to a specific named resolved location.
   * Fails if the location is not yet resolved.
   */
  distance_to: (ctx, c) => {
    const other = refSite(ctx, c.location);
    if (!other) return blocked(Infinity, 'location "' + c.location + '" not resolved');
    const d = Math.hypot(ctx.x - other[0], ctx.z - other[1]);
    const min = c.minimum ?? 0;
    const pass = d >= min;
    return ok(pass, d, 'distance to ' + c.location + ' is ' + Math.round(d) + ' blocks');
  },

  /**
   * Reachability to a capital via walking distance (land path only).
   * Measures detour factor (octile walking path / straight-line distance).
   *
   * The walk field is flooded ONCE per capital per seed and memoised: every
   * candidate of every town then reads a single cell instead of running its
   * own BFS — that lookup was the difference between ~2.9 s and ~1.5 s a seed.
   */
  reachability: (ctx, c) => {
    const capital = refSite(ctx, c.location);
    if (!capital) return blocked(Infinity, 'capital "' + c.location + '" not resolved');
    const key = 'dfield:' + capital[0] + ':' + capital[1];
    let field = ctx.memo.get(key);
    if (!field) {
      field = distanceField(ctx.mask, ctx.geo, capital[0], capital[1]);
      ctx.memo.set(key, field);
    }
    const walk = fieldDistanceTo(ctx.mask, field, ctx.x, ctx.z);
    if (!Number.isFinite(walk)) return ok(false, Infinity, 'unreachable from ' + c.location);
    const straight = Math.hypot(ctx.x - capital[0], ctx.z - capital[1]);
    const detour = straight > 0 ? walk / straight : 1;
    const maxDetour = c.max_detour ?? 2.5;
    const pass = detour <= maxDetour;
    return ok(pass, detour, 'detour factor ' + detour.toFixed(2) + 'x from ' + c.location);
  },

  /**
   * Water access: nearest water body (river, coast, or lake) within acceptable distance.
   */
  water_access: (ctx, c) => {
    const mask = ctx.mask, geo = ctx.geo;
    const acceptable = c.acceptable ?? 800;
    let minDist = Infinity;

    const waterBodies = geo.waterBodies();
    if (waterBodies.length > 0) {
      for (const body of waterBodies) {
        const d = distanceToComponent(mask, geo, ctx.x, ctx.z, body.id, acceptable);
        if (d < minDist) minDist = d;
      }
    }

    const pass = Number.isFinite(minDist) && minDist <= acceptable;
    const detail = Number.isFinite(minDist)
      ? 'water at ' + Math.round(minDist) + ' blocks'
      : 'no water within ' + acceptable;
    return ok(pass, minDist, detail);
  },

  /**
   * Corridor lateral: distance to cardinal axis (default x=0 or z=0).
   */
  corridor_lateral: (ctx, c) => {
    const axis = c.axis ?? 'north';
    const outerBand = c.outer_band ?? 5000;

    let distance;
    if (axis === 'north' || axis === 'south') {
      distance = Math.abs(ctx.x);
    } else if (axis === 'east' || axis === 'west') {
      distance = Math.abs(ctx.z);
    } else {
      return ok(true, 0, 'unknown axis ' + axis);
    }

    const pass = distance <= outerBand;
    return ok(pass, distance, 'distance to ' + axis + ' axis: ' + Math.round(distance) + ' blocks');
  },

  /**
   * Mean height change per sampled cell, normalised to blocks-of-rise per
   * 16 blocks of travel — so the number means the same thing whether it was
   * measured on a 192-block coarse grid or a 16-block fine one.
   *
   * Marked `"fine": true` in a spec, it is re-measured on a local fine grid for
   * the chosen site only (report §10's coarse/fine split): regional relief at
   * 192-block spacing is not the same question as "can I build here".
   */
  terrain_flatness: (ctx, c) => {
    const grid = c.fine ? ctx.fineGrid(c.radius ?? 500) : ctx.grid;
    const raw = terrainRoughness(grid, ctx.x, ctx.z, c.radius ?? 500);
    const v = (raw / grid.step) * 16;
    return ok(v <= (c.maximum ?? Infinity), v,
      v.toFixed(2) + ' blocks per 16  (' + raw.toFixed(1) + ' per ' + grid.step + '-block cell' + (c.fine ? ', fine pass' : '') + ')');
  },

  /** Distance in blocks to the nearest cell of the largest water body. */
  distance_to_open_ocean: (ctx, c) => {
    const bodies = ctx.geo.waterBodies();
    if (!bodies.length) return ok(false, Infinity, 'no water in the scan window');
    const d = distanceToComponent(ctx.mask, ctx.geo, ctx.x, ctx.z, bodies[0].id, c.maximum ?? Infinity);
    return ok(d >= (c.minimum ?? 0) && d <= (c.maximum ?? Infinity), d, Math.round(d) + ' blocks');
  },

  /** Surface height band at the site. */
  surface_height: (ctx, c) => {
    const [jx, jz] = worldToCell(ctx.mask, ctx.x, ctx.z);
    if (!inBounds(ctx.mask, jx, jz)) return ok(false, 0, 'outside scan window');
    const y = ctx.grid.surfaceY[jz * ctx.mask.nx + jx];
    return ok(y >= (c.minimum ?? -Infinity) && y <= (c.maximum ?? Infinity), y, 'y=' + y);
  },
};

/** Score terms map a constraint's `value` into 0..1. */
export const SCORERS = {
  terrain_flatness: (v, c) => clamp01(1 - v / (c.reference ?? 4)),
  coastline: (v, c) => clamp01(v / (c.reference ?? 4000)),
  buildable_area: (v, c) => clamp01(v / (c.reference ?? 400000)),
  island_feel: (v) => clamp01(v),
  large_connected_ocean: (v, c) => clamp01(v / (c.reference ?? 50000000)),
  distance_to_open_ocean: (v, c) => clamp01(1 - v / (c.reference ?? 4000)),
  biome_within: (v, c) => clamp01(1 - v / (c.reference ?? 2000)),
  land_at: (v, c) => clamp01(1 - v / (c.reference ?? 500)),
  landmass_area: (v, c) => clamp01(v / (c.reference ?? 4000000)),
  surface_height: () => 1,
  land_connected_to: (v) => v,
  separation: (v, c) => {
    // Infinity = nothing placed yet to be near — the unconstrained best case,
    // not the worst one.
    if (v === Infinity) return 1;
    if (!Number.isFinite(v)) return 0;
    if (c.band) { const score = softBandScore(v, c.band); return Number.isFinite(score) ? score : 0; }
    return clamp01(v / (c.reference ?? 1500));
  },
  distance_to: (v, c) => {
    if (!Number.isFinite(v)) return 0;
    if (c.band) { const score = softBandScore(v, c.band); return Number.isFinite(score) ? score : 0; }
    return clamp01(v / (c.reference ?? 1500));
  },
  reachability: (v, c) => {
    if (!Number.isFinite(v)) return 0;
    const idealDetour = c.ideal_detour ?? 1.4;
    const maxDetour = c.max_detour ?? 2.5;
    if (v <= idealDetour) return 1;
    if (v < maxDetour) return (maxDetour - v) / (maxDetour - idealDetour);
    return 0;
  },
  water_access: (v, c) => {
    if (!Number.isFinite(v)) return 0;
    if (c.band) { const score = softBandScore(v, c.band); return Number.isFinite(score) ? score : 0; }
    // One continuous ramp: 1 at the water's edge, 0 at 2× the acceptable
    // distance — no cliff at the threshold (the hard gate lives in the
    // constraint, not the scorer).
    const acceptable = c.acceptable ?? 800;
    return clamp01(1 - v / (acceptable * 2));
  },
  corridor_lateral: (v, c) => {
    if (!Number.isFinite(v)) return 0;
    const innerBand = c.inner_band ?? 1500;
    const outerBand = c.outer_band ?? 5000;
    if (v <= innerBand) return 1;
    if (v < outerBand) return (outerBand - v) / (outerBand - innerBand);
    return 0;
  },
};

const clamp01 = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

const DIRECTIONS = {
  north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0],
  northeast: [1, -1], northwest: [-1, -1], southeast: [1, 1], southwest: [-1, 1],
};

/** Minecraft convention: north is -Z, east is +X. */
export function directionOk(ctx, [tx, tz], dir) {
  const d = DIRECTIONS[dir];
  if (!d) return true;
  const vx = tx - ctx.x, vz = tz - ctx.z;
  const len = Math.hypot(vx, vz) || 1;
  const dl = Math.hypot(d[0], d[1]);
  return (vx * d[0] + vz * d[1]) / (len * dl) > 0.34; // within ~70 degrees
}

export function directionVector(dir) { return DIRECTIONS[dir] ?? null; }

/** Human-readable bearing from the site to a point, for failure messages. */
function bearing(ctx, [tx, tz]) {
  const vx = tx - ctx.x, vz = tz - ctx.z;
  let best = 'nowhere', bestDot = -Infinity;
  for (const [name, d] of Object.entries(DIRECTIONS)) {
    const dot = (vx * d[0] + vz * d[1]) / (Math.hypot(vx, vz) * Math.hypot(d[0], d[1]) || 1);
    if (dot > bestDot) { bestDot = dot; best = name; }
  }
  return best;
}

/** Run one constraint, with a clear error if the type is unknown. */
export function evaluate(ctx, c) {
  const fn = CONSTRAINTS[c.type];
  if (!fn) throw new Error('Unknown constraint type "' + c.type + '". Known: ' + Object.keys(CONSTRAINTS).join(', '));
  const r = fn(ctx, c);
  return { type: c.type, ...r };
}

export { softBandScore };
