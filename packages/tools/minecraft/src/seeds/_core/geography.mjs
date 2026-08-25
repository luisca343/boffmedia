/**
 * geography.mjs — the §7 geographic-analysis API.
 *
 * Pure array work over a land mask. No deepslate, no worldgen, no JSON spec —
 * which means it is testable against synthetic masks with no Minecraft at all
 * (see `seedtool selftest`).
 *
 * Everything is measured in *cells*; helpers convert to blocks using
 * mask.step, so a coarse and a fine mask read the same way.
 */

/** @typedef {{step:number, x0:number, z0:number, nx:number, nz:number, water:Uint8Array}} LandMask */

/** Build a LandMask from a sampleGrid result. */
export function landMaskFrom(grid) {
  return { step: grid.step, x0: grid.x0, z0: grid.z0, nx: grid.nx, nz: grid.nz, water: grid.water };
}

export const cellToWorld = (mask, jx, jz) => [mask.x0 + jx * mask.step, mask.z0 + jz * mask.step];
export const worldToCell = (mask, x, z) => [
  Math.round((x - mask.x0) / mask.step), Math.round((z - mask.z0) / mask.step)];
export const inBounds = (mask, jx, jz) => jx >= 0 && jz >= 0 && jx < mask.nx && jz < mask.nz;

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Connected components over 4-neighbourhood, separately for water and land.
 * One pass, explicit stack (recursion blows up at 20k radius).
 */
export class Geography {
  /** @param {LandMask} mask */
  static analyse(mask) { return new Geography(mask); }

  constructor(mask) {
    this.mask = mask;
    const { nx, nz, water } = mask;
    const n = nx * nz;

    /** component id per cell; -1 = unassigned */
    this.comp = new Int32Array(n).fill(-1);
    /** @type {Array<{id:number,kind:'water'|'land',cells:number,minJX:number,maxJX:number,minJZ:number,maxJZ:number,coastCells:number,touchesEdge:boolean,seedCell:number}>} */
    this.components = [];

    const stack = new Int32Array(n);
    for (let start = 0; start < n; start++) {
      if (this.comp[start] !== -1) continue;
      const isWater = water[start] === 1;
      const id = this.components.length;
      const c = {
        id, kind: isWater ? 'water' : 'land', cells: 0,
        minJX: nx, maxJX: -1, minJZ: nz, maxJZ: -1,
        coastCells: 0, touchesEdge: false, seedCell: start,
      };
      this.components.push(c);

      let sp = 0;
      stack[sp++] = start;
      this.comp[start] = id;
      while (sp > 0) {
        const cur = stack[--sp];
        const jx = cur % nx, jz = (cur - jx) / nx;
        c.cells++;
        if (jx < c.minJX) c.minJX = jx;
        if (jx > c.maxJX) c.maxJX = jx;
        if (jz < c.minJZ) c.minJZ = jz;
        if (jz > c.maxJZ) c.maxJZ = jz;
        if (jx === 0 || jz === 0 || jx === nx - 1 || jz === nz - 1) c.touchesEdge = true;

        let boundary = false;
        for (const [dx, dz] of N4) {
          const ax = jx + dx, az = jz + dz;
          if (ax < 0 || az < 0 || ax >= nx || az >= nz) continue;
          const ai = az * nx + ax;
          if ((water[ai] === 1) !== isWater) { boundary = true; continue; }
          if (this.comp[ai] === -1) { this.comp[ai] = id; stack[sp++] = ai; }
        }
        if (boundary) c.coastCells++;
      }
    }

    this._decorate();
  }

  _decorate() {
    const { step } = this.mask;
    const a = step * step;
    for (const c of this.components) {
      c.areaBlocks = c.cells * a;
      c.coastlineBlocks = c.coastCells * step;
      c.bbox = {
        minX: this.mask.x0 + c.minJX * step, maxX: this.mask.x0 + c.maxJX * step,
        minZ: this.mask.z0 + c.minJZ * step, maxZ: this.mask.z0 + c.maxJZ * step,
      };
      const jx = c.seedCell % this.mask.nx;
      c.anchor = cellToWorld(this.mask, jx, (c.seedCell - jx) / this.mask.nx);
    }
  }

  /** Water bodies, largest first. `touchesEdge` means areaBlocks is a LOWER BOUND. */
  waterBodies() {
    return this.components.filter(c => c.kind === 'water').sort((p, q) => q.cells - p.cells);
  }

  landMasses() {
    return this.components.filter(c => c.kind === 'land').sort((p, q) => q.cells - p.cells);
  }

  /** @returns {number|null} component id at a world position */
  bodyAt(x, z) {
    const [jx, jz] = worldToCell(this.mask, x, z);
    if (!inBounds(this.mask, jx, jz)) return null;
    return this.comp[jz * this.mask.nx + jx];
  }

  component(id) { return id === null ? null : this.components[id]; }

  /** Are two points on the same land component (i.e. walkable without a boat)? */
  reachableByLand(a, b) {
    const ca = this.bodyAt(a[0], a[1]), cb = this.bodyAt(b[0], b[1]);
    if (ca === null || cb === null) return false;
    const A = this.components[ca];
    return A.kind === 'land' && ca === cb;
  }

  /** Cells of a component that border the other medium, as world coords. */
  coastline(id) {
    const { nx, nz, water } = this.mask;
    const out = [];
    const isWater = this.components[id].kind === 'water';
    for (let jz = 0; jz < nz; jz++) {
      for (let jx = 0; jx < nx; jx++) {
        const i = jz * nx + jx;
        if (this.comp[i] !== id) continue;
        for (const [dx, dz] of N4) {
          const ax = jx + dx, az = jz + dz;
          if (ax < 0 || az < 0 || ax >= nx || az >= nz) continue;
          if ((water[az * nx + ax] === 1) !== isWater) { out.push(cellToWorld(this.mask, jx, jz)); break; }
        }
      }
    }
    return out;
  }
}

/* ------------------------------------------------------------------------ */
/* Local measurements used by constraints and site scoring                    */
/* ------------------------------------------------------------------------ */

/** Fraction of cells within `radius` blocks of (x,z) that are water. */
export function waterFraction(mask, x, z, radius) {
  const r = Math.max(1, Math.round(radius / mask.step));
  const [cx, cz] = worldToCell(mask, x, z);
  let water = 0, total = 0;
  const r2 = r * r;
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r2) continue;
      const jx = cx + dx, jz = cz + dz;
      if (!inBounds(mask, jx, jz)) continue;
      total++;
      water += mask.water[jz * mask.nx + jx];
    }
  }
  return total ? water / total : 0;
}

/**
 * Coastline length inside a radius, in blocks. This is the "island feel"
 * measure chosen over a hard landmass-area cap (report §8): it rewards a spawn
 * ringed by water without forbidding a land bridge to the cities.
 */
export function coastlineLength(mask, x, z, radius) {
  const r = Math.max(1, Math.round(radius / mask.step));
  const [cx, cz] = worldToCell(mask, x, z);
  const r2 = r * r;
  let edges = 0;
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r2) continue;
      const jx = cx + dx, jz = cz + dz;
      if (!inBounds(mask, jx, jz)) continue;
      const i = jz * mask.nx + jx;
      if (mask.water[i]) continue;
      // Each land-water edge is counted exactly once, because we only ever
      // iterate the land side of it.
      for (const [ex, ez] of N4) {
        const ax = jx + ex, az = jz + ez;
        if (!inBounds(mask, ax, az)) continue;
        if (mask.water[az * mask.nx + ax]) edges++;
      }
    }
  }
  return edges * mask.step;
}

/** Contiguous land cells reachable from (x,z) without crossing water, capped. */
export function buildableArea(mask, x, z, maxRadius, geo) {
  const id = geo.bodyAt(x, z);
  if (id === null || geo.components[id].kind !== 'land') return 0;
  const r = Math.max(1, Math.round(maxRadius / mask.step));
  const [cx, cz] = worldToCell(mask, x, z);
  let cells = 0;
  const r2 = r * r;
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r2) continue;
      const jx = cx + dx, jz = cz + dz;
      if (!inBounds(mask, jx, jz)) continue;
      if (geo.comp[jz * mask.nx + jx] === id) cells++;
    }
  }
  return cells * mask.step * mask.step;
}

/**
 * Mean absolute height difference between neighbouring cells, in blocks.
 * Lower = flatter = easier to build a city on.
 */
export function terrainRoughness(grid, x, z, radius) {
  const r = Math.max(1, Math.round(radius / grid.step));
  const cx = Math.round((x - grid.x0) / grid.step), cz = Math.round((z - grid.z0) / grid.step);
  let sum = 0, n = 0;
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      const jx = cx + dx, jz = cz + dz;
      if (jx < 0 || jz < 0 || jx >= grid.nx - 1 || jz >= grid.nz - 1) continue;
      const i = jz * grid.nx + jx;
      sum += Math.abs(grid.surfaceY[i] - grid.surfaceY[i + 1]);
      sum += Math.abs(grid.surfaceY[i] - grid.surfaceY[i + grid.nx]);
      n += 2;
    }
  }
  return n ? sum / n : Infinity;
}

/**
 * Straight-line distance in blocks from (x,z) to the nearest cell belonging to
 * `componentId`, or Infinity. Used for "distance to open ocean".
 */
export function distanceToComponent(mask, geo, x, z, componentId, maxRadius = Infinity) {
  const [cx, cz] = worldToCell(mask, x, z);
  const rMax = Number.isFinite(maxRadius)
    ? Math.round(maxRadius / mask.step) : Math.max(mask.nx, mask.nz);
  for (let r = 0; r <= rMax; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const jx = cx + dx, jz = cz + dz;
        if (!inBounds(mask, jx, jz)) continue;
        if (geo.comp[jz * mask.nx + jx] === componentId) {
          return Math.hypot(dx, dz) * mask.step;
        }
      }
    }
  }
  return Infinity;
}

/** Nearest cell whose biome matches, as [x,z,distanceBlocks] or null. */
export function nearestBiome(grid, x, z, matchIdx, maxRadius = Infinity) {
  const cx = Math.round((x - grid.x0) / grid.step), cz = Math.round((z - grid.z0) / grid.step);
  const rMax = Number.isFinite(maxRadius) ? Math.round(maxRadius / grid.step) : Math.max(grid.nx, grid.nz);
  for (let r = 0; r <= rMax; r++) {
    let best = null, bestD = Infinity;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const jx = cx + dx, jz = cz + dz;
        if (jx < 0 || jz < 0 || jx >= grid.nx || jz >= grid.nz) continue;
        if (!matchIdx.has(grid.biome[jz * grid.nx + jx])) continue;
        const d = Math.hypot(dx, dz) * grid.step;
        if (d < bestD) { bestD = d; best = [grid.x0 + jx * grid.step, grid.z0 + jz * grid.step, d]; }
      }
    }
    if (best) return best;
  }
  return null;
}
