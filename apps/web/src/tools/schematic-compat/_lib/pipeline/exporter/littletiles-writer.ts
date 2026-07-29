/**
 * Legacy (1.12) LittleTiles → modern LittleTiles converter, applied to a
 * structure right before a `.schem` export.
 *
 * Modern format (verified against a WorldEdit cut from LittleTiles 1.21.1 and
 * the mod's source — BETiles.saveAdditional / LittleCollection.saveExtended /
 * LittleBox.createExtended):
 *
 *   host palette entry  littletiles:tiles[waterlogged=false]
 *   TE data             { id: "littletiles:tiles", grid: <int>, content: {
 *                           tiles: { "<blockstate>": List<IntArray> },
 *                           children: [ <one entry per structure here> ] } }
 *   tiles list          per tile: IntArray[1] = ARGB color (-1 untinted),
 *                       then one IntArray[7] per box = [faceCache, x0,y0,z0,
 *                       x1,y1,z1] in 1/grid units. faceCache 0 = "no cache";
 *                       the mod recomputes it lazily. The 7-int form is
 *                       mandatory — BETiles loads through createExtended, which
 *                       reads index 0 as the cache.
 *   children entry      { tiles: <same compound shape>, index: int, type: int,
 *                       structure: {…} (main block only) | coord: IntArray[3]
 *                       (member → main linkage, verbatim from 1.12 — never a
 *                       placement offset) }
 *
 * 1.12 structures whose type the modern registry can load keep their topology:
 * each legacy `children` entry becomes a modern one, and the main entry's
 * compound is rewritten by ./littletiles-structures. Everything else —
 * unknown/unsupported types, orphan members, instances cut by the selection or
 * carrying nested structure links — flattens to plain free tiles in each
 * member's own cell, with one warning per instance collected into
 * `metadata.littleTilesStructureWarnings`.
 *
 * The side-cache ints (north/south/…) BETiles also saves are nullable caches
 * and are omitted. Transformable boxes (slopes) share their wire layout across
 * 1.12 and 1.21, so `[bounds, indicator, packed…]` passes through verbatim
 * behind the faceCache.
 */
import {
  loadLegacyTables,
  type LegacyTables,
} from "@/lib/schematic/loader/legacy/legacy-mapper";
import {
  parseLittleTilesEntity,
  isLittleTilesEntity,
  isModernLittleTilesEntity,
  type LittleTilesChild,
  type LittleTilesEntity,
  type LittleTilesTile,
} from "@/lib/schematic/loader/littletiles";
import {
  LT_STRUCTURE_ATTRIBUTES,
  LT_STRUCTURE_ID_MAP,
  structureSupport,
} from "@/lib/schematic/loader/littletiles-support";
import { serializeBlockState, parseBlockState } from "@/lib/schematic/normalizer";
import type { SchematicStructure, TileEntity, UnifiedBlock } from "@/lib/schematic/types";
import { convertLtStructure, hasNestedStructureLinks } from "./littletiles-structures";

/** 1.12 LT-internal material blocks → their modern equivalents. */
const LT_MATERIAL_RENAMES: Record<string, string> = {
  "littletiles:ltcoloredblock": "littletiles:colored_clean",
  "littletiles:ltcoloredblock2": "littletiles:colored_clean",
  "littletiles:lttransparentcoloredblock": "littletiles:colored_clean",
  "littletiles:ltflowingwater": "minecraft:water",
  "littletiles:ltwhiteflowingwater": "minecraft:water",
  "littletiles:ltflowinglava": "minecraft:lava",
  "littletiles:ltwhiteflowinglava": "minecraft:lava",
};

function resolveMaterialState(
  block: UnifiedBlock,
  materialMap: Record<string, string>
): string {
  const mapped = materialMap[block.id] ?? LT_MATERIAL_RENAMES[block.id];
  return mapped ?? serializeBlockState(block);
}

function isAirState(state: string): boolean {
  const id = state.indexOf("[") === -1 ? state : state.slice(0, state.indexOf("["));
  return id === "air" || id.endsWith(":air");
}

/**
 * Resolve a 1.12 `"mod:block[:meta]"` reference (structure_builder's `block`)
 * exactly like tile materials: legacy tables → LT renames → user materialMap.
 * Null when it lands on air, so the caller drops the key.
 */
function resolveLegacyRef(
  raw: string,
  tables: LegacyTables,
  materialMap: Record<string, string>,
): string | null {
  const parts = raw.split(":");
  let meta = 0;
  if (parts.length > 2 && /^\d+$/.test(parts[parts.length - 1])) {
    meta = parseInt(parts.pop()!, 10);
  }
  const namespace = parts.length > 1 ? parts[0] : "minecraft";
  const name = parts[parts.length - 1];

  let block: UnifiedBlock;
  if (namespace === "minecraft") {
    const id = tables.names[name];
    const mapped =
      id !== undefined ? tables.blocks[`${id}:${meta}`] ?? tables.blocks[`${id}:0`] : undefined;
    block = parseBlockState(mapped ?? `minecraft:${name}`);
  } else {
    block = parseBlockState(`${namespace}:${name}`);
    if (meta !== 0) block.states = { meta: String(meta) };
  }
  const state = resolveMaterialState(block, materialMap);
  return isAirState(state) ? null : state;
}

/** Sign-extend the two 16-bit halves of a packed int (HIGH half first). */
function unpackShorts(v: number): [number, number] {
  return [(((v >> 16) & 0xffff) << 16) >> 16, ((v & 0xffff) << 16) >> 16];
}

/**
 * Rescale a box between grids. Two entities can contribute to the same cell
 * with different grids; the cell keeps the finest one and coarser boxes scale
 * up, which is exact because LT grids are powers of two. A transformable box
 * additionally scales its packed corner-offset shorts — the indicator (index
 * 6) is a bitfield and must pass through untouched.
 */
function rescale(box: number[], from: number, to: number): number[] {
  if (from === to) return box;
  const f = to / from;
  if (box.length <= 6) return box.map((v) => Math.round(v * f));
  const out = box.slice();
  for (let i = 0; i < 6; i++) out[i] = Math.round(box[i] * f);
  for (let i = 7; i < box.length; i++) {
    const [hi, lo] = unpackShorts(box[i]);
    out[i] = ((Math.round(hi * f) & 0xffff) << 16) | (Math.round(lo * f) & 0xffff);
  }
  return out;
}

/** Serialize a box to the modern extended layout: `[faceCache=0, box…]`. */
function extendedBox(box: number[]): Int32Array {
  return Int32Array.of(0, ...box);
}

type Pos = { x: number; y: number; z: number };

const posKey = (p: Pos): string => `${p.x},${p.y},${p.z}`;

/** One legacy `children` entry paired with its owning entity + raw index/type. */
interface EntryRef {
  entity: LittleTilesEntity;
  child: LittleTilesChild;
  rawIndex?: number;
  rawType?: number;
}

/** One structure instance: the main entry (if in the selection) + members. */
interface Instance {
  mainPos: Pos;
  idx: number;
  main?: EntryRef;
  members: EntryRef[];
}

interface BehaviorInstance {
  mainEntry: EntryRef;
  entries: EntryRef[];
  converted: Record<string, unknown>;
  fallbackType: number;
  label: string;
}

/** Accumulated modern content for one block cell. */
interface CellOut {
  pos: Pos;
  grid: number;
  free: Map<string, Int32Array[]>;
  children: Array<Record<string, unknown>>;
}

interface RawEntryMeta {
  index?: number;
  type?: number;
}

/**
 * index/type of each raw 1.12 `children` entry, split by kind so they can be
 * re-paired with the parsed children: the parser preserves entry order and
 * always keeps entries carrying `structure` or `coord` (same validity checks
 * mirrored here), so pairing by kind-order is exact even when tile-only
 * entries were dropped during parsing.
 */
function rawChildMeta(te: TileEntity): { struct: RawEntryMeta[]; coord: RawEntryMeta[] } {
  const content = te.data.content;
  const list =
    typeof content === "object" && content !== null && !Array.isArray(content)
      ? (content as Record<string, unknown>).children
      : undefined;
  const struct: RawEntryMeta[] = [];
  const coord: RawEntryMeta[] = [];
  for (const raw of Array.isArray(list) ? list : []) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
    const c = raw as Record<string, unknown>;
    const meta: RawEntryMeta = {
      index: typeof c.index === "number" ? c.index : undefined,
      type: typeof c.type === "number" ? c.type : undefined,
    };
    if (typeof c.structure === "object" && c.structure !== null && !Array.isArray(c.structure)) {
      struct.push(meta);
    } else if (c.coord instanceof Int32Array && c.coord.length === 3) {
      coord.push(meta);
    }
  }
  return { struct, coord };
}

/**
 * Replace every legacy LittleTiles TE with its modern equivalent and re-stamp
 * the host cells to `littletiles:tiles[waterlogged=false]` (overriding any
 * resolution the user set on the host marker — the tiles need their host).
 * Material resolutions travel in `littleTiles.materialMap` (see the worker's
 * applyResolutions). No-op for structures without LittleTiles content.
 */
export async function convertLittleTilesForExport(
  structure: SchematicStructure
): Promise<SchematicStructure> {
  if (!structure.littleTiles) return structure;
  const tables = await loadLegacyTables();
  const materialMap = structure.littleTiles.materialMap ?? {};
  const { x: width, y: height, z: length } = structure.dimensions;

  const palette = structure.palette.slice();
  const blockData = structure.blockData.slice();

  const paletteIndexOf = (match: (b: UnifiedBlock) => boolean, add: () => UnifiedBlock): number => {
    const found = palette.findIndex(match);
    if (found !== -1) return found;
    palette.push(add());
    return palette.length - 1;
  };
  // Lazy so a schematic without surviving/empty hosts adds no palette entries.
  let hostIdx = -1;
  let airIdx = -1;

  const inBounds = (p: Pos): boolean =>
    p.x >= 0 && p.y >= 0 && p.z >= 0 && p.x < width && p.y < height && p.z < length;

  const tileEntities: TileEntity[] = [];
  const legacyEntities: LittleTilesEntity[] = [];
  /** Cells that held a legacy TE — each ends up a host or, if empty, air. */
  const legacyCells: Pos[] = [];

  const instances = new Map<string, Instance>();
  /** Entries with neither `structure` nor `coord` — no linkage to preserve. */
  const strays: EntryRef[] = [];

  const instanceAt = (mainPos: Pos, idx: number): Instance => {
    const key = `${posKey(mainPos)}|${idx}`;
    let inst = instances.get(key);
    if (!inst) {
      inst = { mainPos, idx, members: [] };
      instances.set(key, inst);
    }
    return inst;
  };

  for (const te of structure.tileEntities) {
    // Already-modern LT TEs (schematics cut from a modern world) pass through
    // untouched — only the legacy 1.12 flavour needs conversion.
    if (!isLittleTilesEntity(te) || isModernLittleTilesEntity(te)) {
      tileEntities.push(te);
      continue;
    }
    legacyCells.push(te.pos);
    const entity = parseLittleTilesEntity(te, tables);
    if (!entity) continue;
    legacyEntities.push(entity);

    const meta = rawChildMeta(te);
    let si = 0;
    let ci = 0;
    for (const child of entity.children) {
      const m = child.structure ? meta.struct[si++] : child.coord ? meta.coord[ci++] : undefined;
      const entry: EntryRef = { entity, child, rawIndex: m?.index, rawType: m?.type };
      if (child.structure) {
        instanceAt(entity.pos, entry.rawIndex ?? 0).main = entry;
      } else if (child.coord) {
        const mainPos = {
          x: entity.pos.x + child.coord[0],
          y: entity.pos.y + child.coord[1],
          z: entity.pos.z + child.coord[2],
        };
        instanceAt(mainPos, entry.rawIndex ?? 0).members.push(entry);
      } else {
        strays.push(entry);
      }
    }
  }

  // Cell grid = finest contributor at that position (grids are powers of two),
  // fixed up front so free AND children tiles land on one lattice per cell.
  const gridAt = new Map<string, number>();
  for (const entity of legacyEntities) {
    const key = posKey(entity.pos);
    gridAt.set(key, Math.max(gridAt.get(key) ?? 0, entity.grid));
  }

  const cells = new Map<string, CellOut>();
  const cellFor = (pos: Pos): CellOut => {
    const key = posKey(pos);
    let cell = cells.get(key);
    if (!cell) {
      cell = { pos, grid: gridAt.get(key) ?? 16, free: new Map(), children: [] };
      cells.set(key, cell);
    }
    return cell;
  };

  /** Encode tiles into a state-keyed map; returns how many tiles survived. */
  const addTiles = (
    map: Map<string, Int32Array[]>,
    tiles: LittleTilesTile[],
    from: number,
    to: number,
  ): number => {
    let kept = 0;
    for (const tile of tiles) {
      const state = resolveMaterialState(tile.block, materialMap);
      if (isAirState(state)) continue; // resolved to air = tile deleted
      let list = map.get(state);
      if (!list) {
        list = [];
        map.set(state, list);
      }
      list.push(Int32Array.of(tile.color));
      for (const box of tile.boxes) list.push(extendedBox(rescale(box, from, to)));
      kept++;
    }
    return kept;
  };

  /** Geometry survives as free tiles in the entry's own cell; linkage dropped. */
  const flattenEntry = (entry: EntryRef): void => {
    const cell = cellFor(entry.entity.pos);
    const stack: LittleTilesChild[] = [entry.child];
    while (stack.length > 0) {
      const child = stack.pop()!;
      addTiles(cell.free, child.tiles, entry.entity.grid, cell.grid);
      if (child.children) stack.push(...child.children);
    }
  };

  for (const entity of legacyEntities) {
    if (entity.tiles.length === 0) continue;
    addTiles(cellFor(entity.pos).free, entity.tiles, entity.grid, gridAt.get(posKey(entity.pos))!);
  }
  for (const stray of strays) flattenEntry(stray);

  const warnings: string[] = [];
  const posStr = (p: Pos): string => `(${p.x}, ${p.y}, ${p.z})`;

  /** Structure indexes already taken per cell — `index` is unique per BlockPos. */
  const usedIndexAt = new Map<string, Set<number>>();
  const reserve = (key: string, i: number): void => {
    let set = usedIndexAt.get(key);
    if (!set) {
      set = new Set();
      usedIndexAt.set(key, set);
    }
    set.add(i);
  };

  const ordered = [...instances.values()].sort(
    (a, b) =>
      a.mainPos.y - b.mainPos.y ||
      a.mainPos.z - b.mainPos.z ||
      a.mainPos.x - b.mainPos.x ||
      a.idx - b.idx,
  );

  const behaviors: BehaviorInstance[] = [];
  for (const inst of ordered) {
    const at = posStr(inst.mainPos);
    const allEntries = inst.main ? [inst.main, ...inst.members] : inst.members;
    const flatten = (warning: string): void => {
      warnings.push(warning);
      for (const entry of allEntries) flattenEntry(entry);
    };

    if (!inst.main) {
      flatten(
        `LittleTiles structure at ${at}: its main block is outside the selection — flattened to plain tiles`,
      );
      continue;
    }
    const rawStruct = inst.main.child.structure!;
    const id = typeof rawStruct.id === "string" ? rawStruct.id : "";
    const support = structureSupport(id);
    if (support !== "behavior") {
      flatten(
        support === "flatten-unsupported"
          ? `LittleTiles structure "${id}" at ${at}: 1.12→1.21 conversion of this type is not supported — flattened to plain tiles`
          : `LittleTiles structure "${id || "?"}" at ${at}: unknown type with no 1.21 equivalent — flattened to plain tiles`,
      );
      continue;
    }
    if (
      hasNestedStructureLinks(rawStruct) ||
      allEntries.some((e) => (e.child.children?.length ?? 0) > 0)
    ) {
      flatten(
        `LittleTiles structure "${id}" at ${at}: nested structure — flattened to plain tiles`,
      );
      continue;
    }
    // `blocks` is the main block's index of its member blocks: every triple
    // must resolve to a member entry inside the selection, or the instance
    // was cut and its links would be corrupted on load.
    const memberKeys = new Set(inst.members.map((e) => posKey(e.entity.pos)));
    const b = rawStruct.blocks;
    let cut = b instanceof Int32Array && b.length % 3 !== 0;
    if (b instanceof Int32Array && !cut) {
      for (let i = 0; i < b.length; i += 3) {
        const p = {
          x: inst.mainPos.x + b[i],
          y: inst.mainPos.y + b[i + 1],
          z: inst.mainPos.z + b[i + 2],
        };
        if (!inBounds(p) || !memberKeys.has(posKey(p))) {
          cut = true;
          break;
        }
      }
    }
    if (cut) {
      flatten(
        `LittleTiles structure "${id}" at ${at}: cut by the selection — flattened to plain tiles`,
      );
      continue;
    }

    const converted = convertLtStructure(rawStruct, {
      resolveBlockRef: (ref) => resolveLegacyRef(ref, tables, materialMap),
      warn: (detail) => warnings.push(`LittleTiles structure "${id}" at ${at}: ${detail}`),
    });
    if (!converted) {
      flatten(
        `LittleTiles structure "${id}" at ${at}: conversion failed — flattened to plain tiles`,
      );
      continue;
    }
    for (const entry of allEntries) {
      if (entry.rawIndex !== undefined) reserve(posKey(entry.entity.pos), entry.rawIndex);
    }
    behaviors.push({
      mainEntry: inst.main,
      entries: allEntries,
      converted,
      fallbackType: LT_STRUCTURE_ATTRIBUTES[LT_STRUCTURE_ID_MAP[id]] ?? 0,
      label: `LittleTiles structure "${id}" at ${at}`,
    });
  }

  for (const bhv of behaviors) {
    // Fallback index: one value for the whole instance, free at every block it
    // touches. Raw 1.12 indexes were reserved above, so instances processed in
    // deterministic order can never collide.
    let fallbackIndex = 0;
    if (bhv.entries.some((e) => e.rawIndex === undefined)) {
      const keys = bhv.entries.map((e) => posKey(e.entity.pos));
      while (keys.some((k) => usedIndexAt.get(k)?.has(fallbackIndex))) fallbackIndex++;
      for (const key of keys) reserve(key, fallbackIndex);
    }

    let survivors = 0;
    const pending: Array<{ cell: CellOut; entry: Record<string, unknown> }> = [];
    for (const e of bhv.entries) {
      const cell = cellFor(e.entity.pos);
      const tilesByState = new Map<string, Int32Array[]>();
      survivors += addTiles(tilesByState, e.child.tiles, e.entity.grid, cell.grid);
      const entry: Record<string, unknown> = {
        tiles: Object.fromEntries(tilesByState),
        index: e.rawIndex ?? fallbackIndex,
        type: e.rawType ?? bhv.fallbackType,
      };
      if (e === bhv.mainEntry) entry.structure = bhv.converted;
      else entry.coord = Int32Array.of(e.child.coord![0], e.child.coord![1], e.child.coord![2]);
      pending.push({ cell, entry });
    }
    // An entry whose tiles all resolved away still anchors the structure, but
    // a structure with no tiles anywhere would be an invisible ghost on load.
    if (survivors === 0) {
      warnings.push(`${bhv.label}: every tile resolved to air — structure dropped`);
      continue;
    }
    for (const { cell, entry } of pending) cell.children.push(entry);
  }

  const liveCells = new Set<string>();
  for (const cell of cells.values()) {
    if (cell.free.size === 0 && cell.children.length === 0) continue;
    liveCells.add(posKey(cell.pos));
    const tiles: Record<string, Int32Array[]> = {};
    for (const [state, list] of cell.free) tiles[state] = list;
    tileEntities.push({
      pos: cell.pos,
      id: "littletiles:tiles",
      data: {
        id: "littletiles:tiles",
        grid: cell.grid,
        content: { tiles, children: cell.children },
      },
    });

    if (!inBounds(cell.pos)) continue;
    if (hostIdx === -1) {
      hostIdx = paletteIndexOf(
        (b) => b.id === "littletiles:tiles",
        () => parseBlockState("littletiles:tiles")
      );
      palette[hostIdx] = { ...palette[hostIdx], states: { waterlogged: "false" } };
    }
    blockData[(cell.pos.y * length + cell.pos.z) * width + cell.pos.x] = hostIdx;
  }

  // A legacy host with nothing left to render (all tiles resolved to air, or
  // its structure was dropped) would paste an empty LittleTiles block.
  for (const pos of legacyCells) {
    if (!inBounds(pos) || liveCells.has(posKey(pos))) continue;
    if (airIdx === -1) {
      airIdx = paletteIndexOf(
        (b) => b.name === "air",
        () => parseBlockState("minecraft:air")
      );
    }
    blockData[(pos.y * length + pos.z) * width + pos.x] = airIdx;
  }

  const metadata =
    warnings.length > 0
      ? { ...structure.metadata, littleTilesStructureWarnings: warnings }
      : structure.metadata;

  return { ...structure, palette, blockData, tileEntities, metadata };
}
