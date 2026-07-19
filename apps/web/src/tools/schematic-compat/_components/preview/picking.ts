import type { BlockPositionGroup } from "../../_lib/types";

/** Minimal vector shape — satisfied structurally by THREE.Vector3. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Occupancy index for crosshair picking in fly mode. `probe` returns 0 for an
 * empty/out-of-bounds cell, `paletteIndex + 1` for a surface cell and
 * `-(paletteIndex + 1)` for an interior cell (visible only at the active
 * Y-slice). Dense typed-array backing up to DENSE_PICK_LIMIT cells; a sparse
 * Map above it (huge culled schematics keep ≤ ~2M live cells).
 */
export interface PickIndex {
  probe: (x: number, y: number, z: number) => number;
  idOf: (code: number) => string | undefined;
}

export const DENSE_PICK_LIMIT = 8_388_608; // ≈203³ → ≤32MB Int32 grid

export function buildPickIndex(
  groups: BlockPositionGroup[],
  dims: { x: number; y: number; z: number },
): PickIndex {
  const { x: sx, y: sy, z: sz } = dims;
  const volume = sx * sy * sz;
  const names = new Map<number, string>();
  const li = (x: number, y: number, z: number) => (y * sz + z) * sx + x;

  let write: (key: number, code: number) => void;
  let read: (key: number) => number;
  if (volume <= DENSE_PICK_LIMIT) {
    const grid = new Int32Array(volume);
    write = (key, code) => { grid[key] = code; };
    read = (key) => grid[key];
  } else {
    const map = new Map<number, number>();
    write = (key, code) => { map.set(key, code); };
    read = (key) => map.get(key) ?? 0;
  }
  for (const g of groups) {
    names.set(g.paletteIndex, g.block.id);
    const code = g.paletteIndex + 1;
    const p = g.positions;
    for (let i = 0; i < p.length; i += 3) write(li(p[i], p[i + 1], p[i + 2]), code);
    const ip = g.interiorPositions;
    if (ip) for (let i = 0; i < ip.length; i += 3) write(li(ip[i], ip[i + 1], ip[i + 2]), -code);
  }
  return {
    probe: (x, y, z) =>
      x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz ? read(li(x, y, z)) : 0,
    idOf: (code) => names.get(Math.abs(code) - 1),
  };
}

/**
 * Amanatides–Woo voxel walk from `origin` along `dir` (unit vector): the id of
 * the first visible block within `maxDist`, or null. Blocks are unit cells
 * centred on integer coordinates (span ±0.5). Respects the Y-layer cutoff —
 * surface cells hit when y ≤ layerY, interior cells only at y === layerY. Never
 * a per-instance raycast: that would touch millions of instances per query.
 */
export function ddaPick(
  origin: Vec3,
  dir: Vec3,
  index: PickIndex,
  layerY: number,
  maxDist: number,
): string | null {
  let cx = Math.floor(origin.x + 0.5);
  let cy = Math.floor(origin.y + 0.5);
  let cz = Math.floor(origin.z + 0.5);
  const stepX = dir.x > 0 ? 1 : -1;
  const stepY = dir.y > 0 ? 1 : -1;
  const stepZ = dir.z > 0 ? 1 : -1;
  const tDeltaX = Math.abs(1 / dir.x); // Infinity on an unused axis
  const tDeltaY = Math.abs(1 / dir.y);
  const tDeltaZ = Math.abs(1 / dir.z);
  const bound = (o: number, c: number, d: number) =>
    d > 0 ? (c + 0.5 - o) / d : d < 0 ? (c - 0.5 - o) / d : Infinity;
  let tMaxX = bound(origin.x, cx, dir.x);
  let tMaxY = bound(origin.y, cy, dir.y);
  let tMaxZ = bound(origin.z, cz, dir.z);
  let t = 0;
  while (t <= maxDist) {
    const code = index.probe(cx, cy, cz);
    if (code > 0 ? cy <= layerY : code < 0 && cy === layerY) return index.idOf(code) ?? null;
    if (tMaxX <= tMaxY && tMaxX <= tMaxZ) { cx += stepX; t = tMaxX; tMaxX += tDeltaX; }
    else if (tMaxY <= tMaxZ) { cy += stepY; t = tMaxY; tMaxY += tDeltaY; }
    else { cz += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; }
  }
  return null;
}

/** Largest single-Y run in a Y-sorted positions array — the slice mesh capacity. */
export function maxSliceCount(positions: Float32Array): number {
  let max = 0;
  let run = 0;
  let y = Number.NaN;
  for (let i = 1; i < positions.length; i += 3) {
    if (positions[i] === y) run += 1;
    else { y = positions[i]; run = 1; }
    if (run > max) max = run;
  }
  return max;
}

/**
 * Instances visible under the Y-layer cutoff: how many leading triples of a
 * Y-sorted positions array have y ≤ maxLayerY (upper-bound binary search).
 */
export function cutoffCount(positions: Float32Array, maxLayerY: number): number {
  const n = positions.length / 3;
  let lo = 0;
  let hi = n - 1;
  let last = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (positions[mid * 3 + 1] <= maxLayerY) { last = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return last + 1;
}

/**
 * The window of triples with y === layerY in a Y-sorted positions array, as
 * [firstTripleIndex, count] via two binary searches.
 */
export function sliceRange(positions: Float32Array, layerY: number): [number, number] {
  const n = positions.length / 3;
  let lo = 0;
  let hi = n - 1;
  let first = n;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (positions[mid * 3 + 1] >= layerY) { first = mid; hi = mid - 1; }
    else lo = mid + 1;
  }
  lo = first;
  hi = n - 1;
  let last = first - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (positions[mid * 3 + 1] <= layerY) { last = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return [first, Math.max(0, last - first + 1)];
}
