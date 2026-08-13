/**
 * Precomputed per-box face-culling caches for exported LittleTiles content,
 * mirroring the modern mod's lazy computation (LittleServerFace.calculate /
 * LittleBox.fill, LT branch `1.21`).
 *
 * Why precompute: BETiles only recomputes a face when its cached state is 0
 * (UNLOADED), and a neighbour change only re-evaluates faces already cached as
 * OUTSIDE_*. A WorldEdit paste delivers blocks and block-entity data in
 * whatever order the packets land, so faces computed lazily mid-paste can
 * capture a neighbour that isn't there yet — and that wrong state sticks,
 * showing up as see-through or z-fighting slivers exactly on LT↔LT cell seams
 * until something updates the block. A real in-game WorldEdit cut never hits
 * this because BETiles.saveAdditional persists computed caches; writing them
 * ourselves gives the export the same immunity.
 *
 * Encoding (LittleBox.setFaceState): 4 bits per face at `ordinal * 4`, facing
 * ordinals DOWN=0 UP=1 NORTH=2 SOUTH=3 WEST=4 EAST=5 (CreativeCore Facing),
 * nibble = LittleFaceState ordinal: 0 UNLOADED, 1 INSIDE_UNCOVERED,
 * 2 INSIDE_PARTIALLY_COVERED, 3 INSIDE_COVERED, 4 OUTSIDE_UNCOVERED,
 * 5 OUTSIDE_PARTIALLY_COVERED, 6 OUTSIDE_COVERED.
 *
 * Fidelity notes, all erring toward "render the face" (overdraw is invisible;
 * a wrongly culled face is a hole):
 * - Faces against cells we can't model (vanilla blocks, schematic boundary,
 *   already-modern LT TEs that pass through untouched) are written
 *   OUTSIDE_UNCOVERED — still `outside()`, so the mod's neighbour-change path
 *   keeps re-evaluating them in-game.
 * - Translucency is judged from the blockstate string (the mod asks the real
 *   Block). Unknown blocks count as opaque, glass/water/ice/etc. as
 *   translucent; a translucent or alpha-tinted tile never fills a face but two
 *   tiles of identical state+color still cull each other
 *   (canBeRenderCombined).
 * - Transformable boxes (slopes) keep faceCache 0 — the mod recomputes them
 *   lazily — and contribute only "partially filled" to other faces
 *   (LittleServerFace.supportsCutting() is false, so the mod does the same).
 * - Grid conversion between neighbouring cells truncates like the mod's
 *   ILittleFace.convertTo (integer division), including the vacuous-fill
 *   "empty rect ⇒ covered" outcome, for byte-parity with in-game recompute.
 */

/** Structural view of the writer's per-cell output (see CellOut there). */
export interface FaceCacheCell {
  pos: { x: number; y: number; z: number };
  grid: number;
  free: Map<string, Int32Array[]>;
  children: Array<Record<string, unknown>>;
}

const NOCOLLISION = 2;

/** [axisIndex (0=X 1=Y 2=Z), positive] in CreativeCore Facing ordinal order. */
const FACINGS: ReadonlyArray<readonly [number, boolean]> = [
  [1, false], // DOWN
  [1, true], // UP
  [2, false], // NORTH
  [2, true], // SOUTH
  [0, false], // WEST
  [0, true], // EAST
];

const OTHER_AXES: ReadonlyArray<readonly [number, number]> = [
  [1, 2], // facing axis X → rect on Y,Z
  [0, 2], // facing axis Y → rect on X,Z
  [0, 1], // facing axis Z → rect on X,Y
];

const TRANSLUCENT_NAMES = new Set([
  "water",
  "ice",
  "frosted_ice",
  "slime_block",
  "honey_block",
  "barrier",
  "structure_void",
]);

function stateName(state: string): string {
  const id = state.indexOf("[") === -1 ? state : state.slice(0, state.indexOf("["));
  return id.indexOf(":") === -1 ? id : id.slice(id.lastIndexOf(":") + 1);
}

function isTranslucentState(state: string): boolean {
  const name = stateName(state);
  return name.includes("glass") || TRANSLUCENT_NAMES.has(name);
}

/** Fluids don't cull over cell edges (LittleTile.cullOverEdge → false). */
function isFluidState(state: string): boolean {
  const name = stateName(state);
  return name === "water" || name === "lava";
}

function hasFullAlpha(color: number): boolean {
  return ((color >>> 24) & 0xff) === 0xff;
}

/** Extended-layout transformable box: [faceCache, bounds…, indicator<0, …]. */
function isTransformable(arr: Int32Array): boolean {
  return arr.length >= 8 && arr[7] < 0;
}

interface FillTile {
  state: string;
  color: number;
  /** doesProvideSolidFace: opaque block and untinted/full-alpha color. */
  solid: boolean;
  fluid: boolean;
  boxes: Int32Array[];
}

/** Decode a state-keyed tile list ([color] run header, then extended boxes). */
function tilesOf(map: Iterable<[string, Int32Array[]]>): FillTile[] {
  const out: FillTile[] = [];
  for (const [state, list] of map) {
    const translucent = isTranslucentState(state);
    const fluid = isFluidState(state);
    let current: FillTile | null = null;
    for (const arr of list) {
      if (arr.length === 1) {
        current = {
          state,
          color: arr[0],
          solid: !translucent && hasFullAlpha(arr[0]),
          fluid,
          boxes: [],
        };
        out.push(current);
      } else if (current) {
        current.boxes.push(arr);
      }
    }
  }
  return out;
}

interface CellFillers {
  grid: number;
  /** Tiles that can fill faces; noCollision-structure tiles are excluded. */
  tiles: FillTile[];
}

function childTiles(entry: Record<string, unknown>): Array<[string, Int32Array[]]> {
  const tiles = entry.tiles;
  if (typeof tiles !== "object" || tiles === null) return [];
  return Object.entries(tiles as Record<string, Int32Array[]>);
}

function fillersOf(cell: FaceCacheCell): CellFillers {
  const tiles = tilesOf(cell.free);
  for (const entry of cell.children) {
    const type = typeof entry.type === "number" ? entry.type : 0;
    if (type & NOCOLLISION) continue;
    tiles.push(...tilesOf(childTiles(entry)));
  }
  return { grid: cell.grid, tiles };
}

type Rect = [minOne: number, maxOne: number, minTwo: number, maxTwo: number];

/** Union-coverage of clipped sub-rects over `rect` (coordinate compression). */
function coverage(rect: Rect, parts: Rect[]): "none" | "partial" | "full" {
  if (parts.length === 0) return "none";
  const ones = [rect[0], rect[1]];
  const twos = [rect[2], rect[3]];
  for (const p of parts) {
    ones.push(p[0], p[1]);
    twos.push(p[2], p[3]);
  }
  const oneEdges = [...new Set(ones)].sort((a, b) => a - b);
  const twoEdges = [...new Set(twos)].sort((a, b) => a - b);
  let covered = 0;
  const total = (rect[1] - rect[0]) * (rect[3] - rect[2]);
  for (let i = 0; i < oneEdges.length - 1; i++) {
    const o0 = oneEdges[i];
    const o1 = oneEdges[i + 1];
    if (o1 <= rect[0] || o0 >= rect[1]) continue;
    for (let j = 0; j < twoEdges.length - 1; j++) {
      const t0 = twoEdges[j];
      const t1 = twoEdges[j + 1];
      if (t1 <= rect[2] || t0 >= rect[3]) continue;
      if (parts.some((p) => p[0] <= o0 && p[1] >= o1 && p[2] <= t0 && p[3] >= t1)) {
        covered += (o1 - o0) * (t1 - t0);
      }
    }
  }
  if (covered >= total) return "full";
  return covered > 0 ? "partial" : "none";
}

/**
 * Fill state of one face plane rect against a cell's tiles — the counterpart
 * of LittleServerFace.calculate's fill loop. `plane` is the qualifying
 * coordinate on the facing axis: a box fills only when its min (positive
 * facing) or max (negative) sits exactly on the plane (LittleBox
 * .intersectsWith).
 */
function fillState(
  fillers: CellFillers,
  axis: number,
  positive: boolean,
  plane: number,
  rect: Rect,
  tested: { state: string; color: number; box: Int32Array },
): "none" | "partial" | "full" {
  const [oneAxis, twoAxis] = OTHER_AXES[axis];
  const parts: Rect[] = [];
  let partial = false;
  for (const tile of fillers.tiles) {
    const combinable = tile.state === tested.state && tile.color === tested.color;
    if (!tile.solid && !combinable) continue;
    for (const arr of tile.boxes) {
      if (arr === tested.box) continue;
      const transformable = isTransformable(arr);
      // Extended layout: bounds at indices 1..6 (mins 1..3, maxs 4..6).
      const min = (a: number): number => arr[1 + a];
      const max = (a: number): number => arr[4 + a];
      if ((positive ? min(axis) : max(axis)) !== plane) continue;
      const o0 = Math.max(min(oneAxis), rect[0]);
      const o1 = Math.min(max(oneAxis), rect[1]);
      const t0 = Math.max(min(twoAxis), rect[2]);
      const t1 = Math.min(max(twoAxis), rect[3]);
      if (o0 >= o1 || t0 >= t1) continue;
      if (transformable) partial = true;
      else parts.push([o0, o1, t0, t1]);
    }
  }
  const state = coverage(rect, parts);
  return state === "none" && partial ? "partial" : state;
}

const INSIDE_STATE = { none: 1, partial: 2, full: 3 } as const;
const OUTSIDE_STATE = { none: 4, partial: 5, full: 6 } as const;

/**
 * Compute and stamp `faceCache` (index 0 of every plain extended box) for all
 * converted cells. Mutates the Int32Arrays in place. Must run after every cell
 * is fully assembled — outside faces read the neighbouring cell's tiles.
 */
export function computeFaceCaches(cells: Map<string, FaceCacheCell>): void {
  const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
  const fillerCache = new Map<string, CellFillers>();
  const fillersAt = (k: string): CellFillers | undefined => {
    const cell = cells.get(k);
    if (!cell) return undefined;
    let f = fillerCache.get(k);
    if (!f) {
      f = fillersOf(cell);
      fillerCache.set(k, f);
    }
    return f;
  };

  for (const cell of cells.values()) {
    const cellKey = key(cell.pos.x, cell.pos.y, cell.pos.z);
    const own = fillersAt(cellKey)!;
    const grid = cell.grid;

    // Every tile in the cell, including noCollision ones — their own faces
    // still get cached; they just don't fill anyone else's.
    const allTiles = [
      ...tilesOf(cell.free),
      ...cell.children.flatMap((entry) => tilesOf(childTiles(entry))),
    ];

    for (const tile of allTiles) {
      for (const box of tile.boxes) {
        if (isTransformable(box)) continue; // stays 0 → lazy recompute
        let cache = 0;
        for (let ordinal = 0; ordinal < FACINGS.length; ordinal++) {
          const [axis, positive] = FACINGS[ordinal];
          const [oneAxis, twoAxis] = OTHER_AXES[axis];
          const origin = positive ? box[4 + axis] : box[1 + axis];
          const rect: Rect = [
            box[1 + oneAxis],
            box[4 + oneAxis],
            box[1 + twoAxis],
            box[4 + twoAxis],
          ];
          const tested = { state: tile.state, color: tile.color, box };

          let nibble: number;
          if (origin > 0 && origin < grid) {
            nibble = INSIDE_STATE[fillState(own, axis, positive, origin, rect, tested)];
          } else if (tile.fluid) {
            nibble = OUTSIDE_STATE.none;
          } else {
            const d = positive ? 1 : -1;
            const neighbor = fillersAt(
              key(
                cell.pos.x + (axis === 0 ? d : 0),
                cell.pos.y + (axis === 1 ? d : 0),
                cell.pos.z + (axis === 2 ? d : 0),
              ),
            );
            if (!neighbor) {
              nibble = OUTSIDE_STATE.none;
            } else {
              // Mirror ILittleFace.convertTo: integer division when the
              // neighbour lattice is coarser (a rect truncated to nothing
              // counts as fully covered — vacuous isFilled), exact scaling
              // when finer.
              let nRect: Rect;
              if (neighbor.grid < grid) {
                const r = grid / neighbor.grid;
                nRect = [
                  Math.floor(rect[0] / r),
                  Math.floor(rect[1] / r),
                  Math.floor(rect[2] / r),
                  Math.floor(rect[3] / r),
                ];
              } else {
                const r = neighbor.grid / grid;
                nRect = [rect[0] * r, rect[1] * r, rect[2] * r, rect[3] * r];
              }
              if (nRect[1] <= nRect[0] || nRect[3] <= nRect[2]) {
                nibble = OUTSIDE_STATE.full;
              } else {
                const plane = positive ? 0 : neighbor.grid;
                nibble =
                  OUTSIDE_STATE[fillState(neighbor, axis, positive, plane, nRect, tested)];
              }
            }
          }
          cache |= nibble << (ordinal * 4);
        }
        box[0] = cache;
      }
    }
  }
}
