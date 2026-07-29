/**
 * LittleTiles tile-entity parser — both generations (see docs/LITTLETILES.md):
 *
 * Legacy (1.12): `content.tiles` is a LIST; each tile carries a material
 * reference (`block`, a `"ns:name[:meta]"` string) and its geometry as one
 * `box` or a `boxes` list — IntArray[6] min/max corners on a 1/`grid` lattice
 * (grid 16 by default). Colored tiles add `color` (ARGB int).
 *
 * Modern (1.18+): `content.tiles` is a COMPOUND keyed by blockstate string;
 * each value is a list of IntArrays where a length-1 array opens a tile with
 * that ARGB color and the following arrays are its boxes — 7 ints
 * `[faceCache, min, max]` (or longer for transformable boxes, whose first 7
 * ints still hold cache + bounding box). `grid` sits at the TE data root.
 *
 * Two consumers:
 *  - `parseLittleTiles` aggregates per-material box groups for the compat diff
 *    and the 3D preview.
 *  - the per-entity parsers keep the per-host structure the modern-format
 *    export writer needs (see exporter/littletiles-writer).
 */
import { parseBlockState } from "../normalizer";
import type { LegacyTables } from "./legacy/legacy-mapper";
import type {
  TileEntity,
  UnifiedBlock,
  LittleTilesData,
  LittleTilesGroup,
  LittleTilesStructure,
} from "../types";

export function isLittleTilesEntity(te: TileEntity): boolean {
  return te.id.toLowerCase().includes("littletiles");
}

function contentOf(te: TileEntity): Record<string, unknown> | null {
  const content = te.data.content;
  if (typeof content !== "object" || content === null || Array.isArray(content)) return null;
  return content as Record<string, unknown>;
}

/** Modern LT TE: `content.tiles` is a blockstate-keyed compound, not a list. */
export function isModernLittleTilesEntity(te: TileEntity): boolean {
  if (!isLittleTilesEntity(te)) return false;
  const tiles = contentOf(te)?.tiles;
  return (
    typeof tiles === "object" && tiles !== null && !Array.isArray(tiles) && !ArrayBuffer.isView(tiles)
  );
}

/**
 * One tile: material + raw ARGB color (-1 = untinted) + its boxes in grid units.
 *
 * A box is either a plain `[x0,y0,z0,x1,y1,z1]` sextet or a *transformable* box
 * `[x0..z1, indicator, packed…]` (length ≥ 8, `indicator < 0`) — LittleTiles'
 * slope/wedge primitive, decoded by {@link decodeTransformableCorners}. The
 * wire layout is identical in 1.12 and 1.21 (LittleTransformableBox.getArray in
 * both), which is what lets the exporter pass slopes through byte-faithfully.
 */
export interface LittleTilesTile {
  block: UnifiedBlock;
  color: number;
  boxes: number[][];
}

/** Transformable box: bounds + indicator int (bit 31 set → negative) + data. */
export function isTransformableBox(box: number[]): boolean {
  return box.length >= 8 && box[6] < 0;
}

/* BoxCorner order from the mod (EUN…WDS): E=maxX/W=minX, U=maxY/D=minY,
 * N=minZ/S=maxZ. Each entry: [xIsMax, yIsMax, zIsMax]. */
const BOX_CORNERS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 0], // EUN
  [1, 1, 1], // EUS
  [1, 0, 0], // EDN
  [1, 0, 1], // EDS
  [0, 1, 0], // WUN
  [0, 1, 1], // WUS
  [0, 0, 0], // WDN
  [0, 0, 1], // WDS
];

/**
 * Decode a transformable box into its 8 corner positions (grid units), in
 * BoxCorner order (EUN, EUS, EDN, EDS, WUN, WUS, WDN, WDS).
 *
 * Faithful port of LittleTransformableBox (identical in the 1.12 and 1.21
 * mods): `box[6]` is the indicator — bits 0–23 flag, per corner×axis
 * (`corner*3 + axis`), that a signed 16-bit offset for that coordinate follows
 * in the packed data. Offsets are consumed in bit order from `box[7…]`, two
 * shorts per int, HIGH half first, and are added to the corner's AABB
 * coordinate. A slope is simply a box with two corners pulled onto a face.
 */
export function decodeTransformableCorners(box: number[]): Float32Array {
  const indicator = box[6];
  const corners = new Float32Array(24);
  let dataIndex = 0;
  const nextShort = (): number => {
    const int = box[7 + (dataIndex >> 1)] ?? 0;
    const raw = dataIndex % 2 === 0 ? (int >> 16) & 0xffff : int & 0xffff;
    dataIndex++;
    return (raw << 16) >> 16; // sign-extend
  };

  for (let i = 0; i < 8; i++) {
    const [xm, ym, zm] = BOX_CORNERS[i];
    let x = box[xm ? 3 : 0];
    let y = box[ym ? 4 : 1];
    let z = box[zm ? 5 : 2];
    if ((indicator >> (i * 3)) & 1) x += nextShort();
    if ((indicator >> (i * 3 + 1)) & 1) y += nextShort();
    if ((indicator >> (i * 3 + 2)) & 1) z += nextShort();
    corners[i * 3] = x;
    corners[i * 3 + 1] = y;
    corners[i * 3 + 2] = z;
  }
  return corners;
}

/**
 * One `children` entry of a legacy TE: a single structure's content *in this
 * block*. The main block's entry carries the `structure` compound; a member
 * block's entry carries `coord` instead — the linkage pointer to the main
 * (main = this TE's pos + coord, verified 33/33 on a real world). Tiles always
 * belong to the owning TE's own cell. Nested entries are sub-structures.
 */
export interface LittleTilesChild {
  tiles: LittleTilesTile[];
  /** Raw `structure` compound — present only on the structure's MAIN entry. */
  structure?: Record<string, unknown>;
  /** Main-block linkage (relative) — present only on member entries. */
  coord?: [number, number, number];
  children?: LittleTilesChild[];
}

export interface LittleTilesEntity {
  pos: { x: number; y: number; z: number };
  grid: number;
  /** Free tiles owned by this block (not part of any structure). */
  tiles: LittleTilesTile[];
  /** Per-structure slices hosted in this block (see {@link LittleTilesChild}). */
  children: LittleTilesChild[];
  /** The TE carried LT structures (doors, chairs, lights…). */
  hasStructures: boolean;
}

/** Every tile of an entity — own free tiles plus all structure slices. */
export function* eachTile(entity: LittleTilesEntity): Generator<LittleTilesTile> {
  yield* entity.tiles;
  const stack = [...entity.children];
  while (stack.length) {
    const child = stack.pop()!;
    yield* child.tiles;
    if (child.children) stack.push(...child.children);
  }
}

/**
 * Resolve a legacy material reference (`"minecraft:wool:2"`,
 * `"appliedenergistics2:sky_stone_block"`, bare `"stone"`) to a modern block.
 * Vanilla names go name → numeric id → legacy table (same fallback chain as the
 * block grid); mod names are already portable and pass through.
 */
function resolveMaterial(raw: string, tables: LegacyTables): UnifiedBlock {
  const parts = raw.split(":");
  let meta = 0;
  if (parts.length > 2 && /^\d+$/.test(parts[parts.length - 1])) {
    meta = parseInt(parts.pop()!, 10);
  }
  const namespace = parts.length > 1 ? parts[0] : "minecraft";
  const name = parts[parts.length - 1];

  if (namespace === "minecraft") {
    const id = tables.names[name];
    if (id !== undefined) {
      const mapped = tables.blocks[`${id}:${meta}`] ?? tables.blocks[`${id}:0`];
      if (mapped) return parseBlockState(mapped);
    }
    return parseBlockState(`minecraft:${name}`);
  }
  const block = parseBlockState(`${namespace}:${name}`);
  if (meta !== 0) block.states = { meta: String(meta) };
  return block;
}

/**
 * Normalize a raw legacy box IntArray. Plain sextets pass through; a
 * transformable box (`arr[6] < 0`, 1.12 and 1.21 share the layout) keeps its
 * indicator + packed corner data so slopes stay slopes. The two pre-1.5 slice
 * formats (length 7 or 11 with a non-negative id at index 6) degrade to their
 * bounding box — the modern mod itself drops them the same way (LittleBox
 * .create), so a converted build matches an in-game paste.
 */
function legacyBox(v: unknown): number[] | null {
  if (!(v instanceof Int32Array) || v.length < 6) return null;
  if (v.length >= 8 && v[6] < 0) return [...v];
  return [...v.slice(0, 6)];
}

/** Parse a legacy `tiles` list. Every tile belongs to the owning TE's cell. */
function parseLegacyTileList(
  rawTiles: unknown,
  tables: LegacyTables,
  out: LittleTilesTile[],
): void {
  for (const rawTile of Array.isArray(rawTiles) ? rawTiles : []) {
    if (typeof rawTile !== "object" || rawTile === null) continue;
    const tile = rawTile as Record<string, unknown>;
    if (typeof tile.block !== "string") continue;

    const boxes: number[][] = [];
    const single = legacyBox(tile.box);
    if (single) boxes.push(single);
    if (Array.isArray(tile.boxes)) {
      for (const b of tile.boxes) {
        const box = legacyBox(b);
        if (box) boxes.push(box);
      }
    }
    if (boxes.length === 0) continue;

    const block = resolveMaterial(tile.block, tables);
    if (block.name === "air") continue;

    out.push({
      block,
      color: typeof tile.color === "number" ? tile.color : -1,
      boxes,
    });
  }
}

/**
 * Parse a content compound's `children` list, keeping the per-structure
 * topology: each entry's tiles stay attributed to it, the main entry keeps its
 * raw `structure` compound and member entries their `coord` linkage (see
 * {@link LittleTilesChild}; tiles always belong to the owning TE's own cell —
 * `coord` is linkage, not placement, verified on a real world where all 540
 * coords resolved to another LT tile entity). Bounded depth — a malformed file
 * must not recurse forever.
 */
function parseChildren(
  content: Record<string, unknown>,
  tables: LegacyTables,
  depth = 0,
): LittleTilesChild[] {
  const raw = Array.isArray(content.children) ? content.children : [];
  if (raw.length === 0 || depth > 4) return [];
  const out: LittleTilesChild[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const c = entry as Record<string, unknown>;
    const child: LittleTilesChild = { tiles: [] };
    parseLegacyTileList(c.tiles, tables, child.tiles);
    if (typeof c.structure === "object" && c.structure !== null && !Array.isArray(c.structure)) {
      child.structure = c.structure as Record<string, unknown>;
    }
    if (c.coord instanceof Int32Array && c.coord.length === 3) {
      child.coord = [c.coord[0], c.coord[1], c.coord[2]];
    }
    const nested = parseChildren(c, tables, depth + 1);
    if (nested.length > 0) child.children = nested;
    if (child.tiles.length > 0 || child.structure || child.coord || child.children) out.push(child);
  }
  return out;
}

/** Parse one legacy (1.12) LittleTiles TE, or `null` when it isn't one. */
export function parseLittleTilesEntity(
  te: TileEntity,
  tables: LegacyTables
): LittleTilesEntity | null {
  if (!isLittleTilesEntity(te)) return null;
  const c = contentOf(te);
  if (!c) return null;
  // 1.12 saves the grid at the TE data ROOT (TileEntityLittleTiles.writeToNBT
  // calls context.set(nbt) on the root compound), and only when it differs
  // from the default 16 — a grid-2 build parsed as 16 shrinks every box to
  // 1/8. content.grid is kept as a fallback for blueprint-style exports.
  const rawGrid = typeof te.data.grid === "number" ? te.data.grid : c.grid;
  const grid = typeof rawGrid === "number" && rawGrid > 0 ? rawGrid : 16;

  const tiles: LittleTilesTile[] = [];
  parseLegacyTileList(c.tiles, tables, tiles);
  // Structure content lives in `children`: a block whose tiles are all part of
  // a structure (a door member, a light) keeps them there, and its plain
  // `tiles` list is empty — skipping children loses the whole structure.
  const children = parseChildren(c, tables);

  return { pos: te.pos, grid, tiles, children, hasStructures: children.length > 0 };
}

/** Parse one modern (1.18+) LittleTiles TE, or `null` when it isn't one. */
export function parseModernLittleTilesEntity(te: TileEntity): LittleTilesEntity | null {
  if (!isModernLittleTilesEntity(te)) return null;
  const c = contentOf(te)!;
  const tilesComp = c.tiles as Record<string, unknown>;
  // Modern grid lives at the TE data root (BETiles), absent = default 16.
  const grid = typeof te.data.grid === "number" && te.data.grid > 0 ? te.data.grid : 16;

  const tiles: LittleTilesTile[] = [];
  for (const [stateStr, list] of Object.entries(tilesComp)) {
    if (!Array.isArray(list)) continue;
    const block = parseBlockState(stateStr);
    if (block.name === "air") continue;
    let current: LittleTilesTile | null = null;
    for (const raw of list) {
      if (!(raw instanceof Int32Array)) continue;
      if (raw.length === 1) {
        // A length-1 array opens a new tile with this color.
        current = { block, color: raw[0], boxes: [] };
        tiles.push(current);
      } else if (raw.length >= 6) {
        // 6 ints: plain box with no cache prefix (LittleGroup.save, blueprints).
        // 7 ints: [faceCache, bounds] (BETiles saveExtended). Longer arrays are
        // transformable boxes — [faceCache, bounds, indicator<0, packed…] when
        // cache-prefixed, [bounds, indicator<0, packed…] when bare — normalized
        // here to the prefix-less layout the corner decoder and exporter use.
        let coords: number[];
        if (raw.length === 6) coords = [...raw];
        else if (raw.length >= 8 && raw[7] < 0) coords = [...raw.slice(1)];
        else if (raw.length >= 8 && raw[6] < 0) coords = [...raw];
        else coords = [raw[1], raw[2], raw[3], raw[4], raw[5], raw[6]];
        if (!current) {
          current = { block, color: -1, boxes: [] };
          tiles.push(current);
        }
        current.boxes.push(coords);
      }
    }
  }

  return {
    pos: te.pos,
    grid,
    tiles: tiles.filter((t) => t.boxes.length > 0),
    // Modern structure topology isn't parsed yet — modern TEs pass through
    // export byte-faithfully, so nothing is lost by leaving this empty.
    children: [],
    hasStructures: Array.isArray(c.children) && c.children.length > 0,
  };
}

/** Parse either generation of LittleTiles TE, dispatching on the NBT shape. */
export function parseAnyLittleTilesEntity(
  te: TileEntity,
  tables: LegacyTables
): LittleTilesEntity | null {
  if (!isLittleTilesEntity(te)) return null;
  return isModernLittleTilesEntity(te)
    ? parseModernLittleTilesEntity(te)
    : parseLittleTilesEntity(te, tables);
}

interface RawBox {
  by: number;
  coords: number[]; // [bx,by,bz, x0,y0,z0, x1,y1,z1] fractions already applied
  color: [number, number, number] | null;
}

interface RawCorners {
  by: number;
  corners: Float32Array; // 8 corners × xyz, absolute world coords
  color: [number, number, number] | null;
}

/** ARGB int → RGB 0..1, or null for white/absent (no tint). */
function tileTint(raw: number): [number, number, number] | null {
  if (raw === -1) return null;
  const r = (raw >> 16) & 0xff;
  const g = (raw >> 8) & 0xff;
  const b = raw & 0xff;
  if (r === 255 && g === 255 && b === 255) return null;
  return [r / 255, g / 255, b / 255];
}

/** Structure instance under construction, keyed by its main block's position. */
interface MutableStructure {
  type: string;
  name?: string;
  mainPos: { x: number; y: number; z: number };
  members: Set<string>;
  tileCount: number;
  boxes: number[]; // stride 9, same layout as LittleTilesGroup.boxes
  corners: number[]; // 24 floats per transformable box
}

/**
 * Parse every LittleTiles TE into per-material box groups, plus one
 * {@link LittleTilesStructure} per structure instance (main block's `structure`
 * compound + members linked via `coord`). Returns `undefined` when the
 * schematic has no LittleTiles content.
 */
export function parseLittleTiles(
  tileEntities: TileEntity[],
  tables: LegacyTables
): LittleTilesData | undefined {
  const byMaterial = new Map<
    string,
    { block: UnifiedBlock; tileCount: number; boxes: RawBox[]; transformed: RawCorners[] }
  >();
  const structures = new Map<string, MutableStructure>();
  let blockCount = 0;
  let tileCount = 0;

  const structureAt = (pos: { x: number; y: number; z: number }): MutableStructure => {
    const key = `${pos.x},${pos.y},${pos.z}`;
    let s = structures.get(key);
    if (!s) {
      s = { type: "", mainPos: pos, members: new Set(), tileCount: 0, boxes: [], corners: [] };
      structures.set(key, s);
    }
    return s;
  };

  const addTile = (
    entity: LittleTilesEntity,
    tile: LittleTilesTile,
    struct: MutableStructure | null,
  ): void => {
    tileCount++;
    let group = byMaterial.get(tile.block.id);
    if (!group) {
      group = { block: tile.block, tileCount: 0, boxes: [], transformed: [] };
      byMaterial.set(tile.block.id, group);
    }
    group.tileCount++;
    if (struct) struct.tileCount++;

    const color = tileTint(tile.color);
    const host = entity.pos;
    for (const box of tile.boxes) {
      if (isTransformableBox(box)) {
        // Slope/wedge: resolve the 8 corners to absolute world coords now so
        // the renderer builds geometry without knowing grids or hosts. Block
        // cells are centred on integer coords (the same convention as the
        // plain-box path: cell origin = host − 0.5).
        const corners = decodeTransformableCorners(box);
        for (let i = 0; i < 8; i++) {
          corners[i * 3] = host.x - 0.5 + corners[i * 3] / entity.grid;
          corners[i * 3 + 1] = host.y - 0.5 + corners[i * 3 + 1] / entity.grid;
          corners[i * 3 + 2] = host.z - 0.5 + corners[i * 3 + 2] / entity.grid;
        }
        group.transformed.push({ by: host.y, corners, color });
        if (struct) struct.corners.push(...corners);
        continue;
      }
      const [x0, y0, z0, x1, y1, z1] = box;
      const coords = [
        host.x, host.y, host.z,
        x0 / entity.grid, y0 / entity.grid, z0 / entity.grid,
        x1 / entity.grid, y1 / entity.grid, z1 / entity.grid,
      ];
      group.boxes.push({ by: host.y, coords, color });
      if (struct) struct.boxes.push(...coords);
    }
  };

  const addChildTree = (
    entity: LittleTilesEntity,
    child: LittleTilesChild,
    struct: MutableStructure | null,
  ): void => {
    for (const tile of child.tiles) addTile(entity, tile, struct);
    // Nested entries are sub-structures; their geometry belongs to the same
    // top-level instance for listing/highlight purposes.
    for (const nested of child.children ?? []) addChildTree(entity, nested, struct);
  };

  for (const te of tileEntities) {
    const entity = parseAnyLittleTilesEntity(te, tables);
    if (!entity) continue;
    blockCount++;

    for (const tile of entity.tiles) addTile(entity, tile, null);
    for (const child of entity.children) {
      let struct: MutableStructure | null = null;
      if (child.structure) {
        struct = structureAt(entity.pos);
        const id = child.structure.id;
        struct.type = typeof id === "string" && id.length > 0 ? id : "unknown";
        if (typeof child.structure.name === "string" && child.structure.name.length > 0) {
          struct.name = child.structure.name;
        }
      } else if (child.coord) {
        const [cx, cy, cz] = child.coord;
        struct = structureAt({ x: entity.pos.x + cx, y: entity.pos.y + cy, z: entity.pos.z + cz });
      }
      struct?.members.add(`${entity.pos.x},${entity.pos.y},${entity.pos.z}`);
      addChildTree(entity, child, struct);
    }
  }

  if (blockCount === 0) return undefined;

  const groups: LittleTilesGroup[] = [];
  for (const { block, tileCount: groupTiles, boxes, transformed } of byMaterial.values()) {
    // Host-Y sort so the preview's layer cutoff can binary-search.
    boxes.sort((a, b) => a.by - b.by);
    const flat = new Float32Array(boxes.length * 9);
    for (let i = 0; i < boxes.length; i++) flat.set(boxes[i].coords, i * 9);
    let colors: Float32Array | undefined;
    if (boxes.some((b) => b.color)) {
      colors = new Float32Array(boxes.length * 3).fill(1);
      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].color) colors.set(boxes[i].color!, i * 3);
      }
    }
    const group: LittleTilesGroup = { block, tileCount: groupTiles, boxes: flat, colors };

    if (transformed.length > 0) {
      transformed.sort((a, b) => a.by - b.by);
      const corners = new Float32Array(transformed.length * 24);
      const hostY = new Float32Array(transformed.length);
      for (let i = 0; i < transformed.length; i++) {
        corners.set(transformed[i].corners, i * 24);
        hostY[i] = transformed[i].by;
      }
      group.corners = corners;
      group.cornerHostY = hostY;
      if (transformed.some((t) => t.color)) {
        const cc = new Float32Array(transformed.length * 3).fill(1);
        for (let i = 0; i < transformed.length; i++) {
          if (transformed[i].color) cc.set(transformed[i].color!, i * 3);
        }
        group.cornerColors = cc;
      }
    }
    groups.push(group);
  }

  const structureList: LittleTilesStructure[] = [...structures.values()]
    .map((s) => {
      const out: LittleTilesStructure = {
        // A member whose main block lies outside the schematic never met its
        // `structure` compound — surface it as "unknown" so the editor can warn.
        type: s.type || "unknown",
        mainPos: s.mainPos,
        blockCount: s.members.size,
        tileCount: s.tileCount,
        boxes: Float32Array.from(s.boxes),
      };
      if (s.name) out.name = s.name;
      if (s.corners.length > 0) out.corners = Float32Array.from(s.corners);
      return out;
    })
    .sort(
      (a, b) =>
        a.type.localeCompare(b.type) ||
        a.mainPos.y - b.mainPos.y ||
        a.mainPos.z - b.mainPos.z ||
        a.mainPos.x - b.mainPos.x,
    );

  return {
    blockCount,
    tileCount,
    groups,
    ...(structureList.length > 0 ? { structures: structureList } : {}),
  };
}
