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
 *                           children: [] } }
 *   tiles list          per tile: IntArray[1] = ARGB color (-1 untinted),
 *                       then one IntArray[7] per box = [faceCache, x0,y0,z0,
 *                       x1,y1,z1] in 1/grid units. faceCache 0 = "no cache";
 *                       the mod recomputes it lazily. The 7-int form is
 *                       mandatory — BETiles loads through createExtended, which
 *                       reads index 0 as the cache.
 *
 * The side-cache ints (north/south/…) BETiles also saves are nullable caches
 * and are omitted. Transformable boxes (slopes) share their wire layout across
 * 1.12 and 1.21, so `[bounds, indicator, packed…]` passes through verbatim
 * behind the faceCache. 1.12 LT structures (`children`) convert as geometry —
 * each member block keeps its own tiles — but the structure behaviour
 * (opening, toggling) is lost.
 */
import { loadLegacyTables } from "@/lib/schematic/loader/legacy/legacy-mapper";
import {
  parseLittleTilesEntity,
  isLittleTilesEntity,
  isModernLittleTilesEntity,
} from "@/lib/schematic/loader/littletiles";
import { serializeBlockState, parseBlockState } from "@/lib/schematic/normalizer";
import type { SchematicStructure, TileEntity, UnifiedBlock } from "@/lib/schematic/types";

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

/** Accumulated modern content for one block cell. */
interface CellContent {
  grid: number;
  /** Modern lists group by blockstate string (LittleCollection.save). */
  tilesByState: Map<string, Int32Array[]>;
}

/** Sign-extend the two 16-bit halves of a packed int (HIGH half first). */
function unpackShorts(v: number): [number, number] {
  return [(((v >> 16) & 0xffff) << 16) >> 16, ((v & 0xffff) << 16) >> 16];
}

/**
 * Rescale a box between grids. Two entities can contribute to the same cell
 * with different grids; the cell keeps the finer one and coarser boxes scale
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

/**
 * Fold every tile into its entity's cell. Structure members each carry their
 * own slice of the structure (a child's `coord` is linkage to the main block,
 * not placement), so per-entity accumulation is already spatially correct; the
 * map only merges entities that share a position across TE lists.
 */
function accumulateCells(
  entities: Array<NonNullable<ReturnType<typeof parseLittleTilesEntity>>>,
  materialMap: Record<string, string>,
): Map<string, { pos: { x: number; y: number; z: number }; content: CellContent }> {
  const cells = new Map<string, { pos: { x: number; y: number; z: number }; content: CellContent }>();

  for (const entity of entities) {
    for (const tile of entity.tiles) {
      const state = resolveMaterialState(tile.block, materialMap);
      if (isAirState(state)) continue; // resolved to air = tile deleted

      const pos = entity.pos;
      const key = `${pos.x},${pos.y},${pos.z}`;
      let cell = cells.get(key);
      if (!cell) {
        cell = { pos, content: { grid: entity.grid, tilesByState: new Map() } };
        cells.set(key, cell);
      }
      if (entity.grid > cell.content.grid) {
        // A finer grid arrived: rescale everything already collected.
        const factor = entity.grid / cell.content.grid;
        for (const list of cell.content.tilesByState.values()) {
          for (let i = 0; i < list.length; i++) {
            if (list[i].length >= 7) {
              list[i] = extendedBox(rescale([...list[i].slice(1)], 1, factor));
            }
          }
        }
        cell.content.grid = entity.grid;
      }

      let list = cell.content.tilesByState.get(state);
      if (!list) {
        list = [];
        cell.content.tilesByState.set(state, list);
      }
      list.push(Int32Array.of(tile.color));
      for (const box of tile.boxes) {
        list.push(extendedBox(rescale(box, entity.grid, cell.content.grid)));
      }
    }
  }
  return cells;
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

  const tileEntities: TileEntity[] = [];
  const legacyEntities: Array<NonNullable<ReturnType<typeof parseLittleTilesEntity>>> = [];
  /** Cells that held a legacy TE — each ends up a host or, if empty, air. */
  const legacyCells: Array<{ x: number; y: number; z: number }> = [];

  for (const te of structure.tileEntities) {
    // Already-modern LT TEs (schematics cut from a modern world) pass through
    // untouched — only the legacy 1.12 flavour needs conversion.
    if (!isLittleTilesEntity(te) || isModernLittleTilesEntity(te)) {
      tileEntities.push(te);
      continue;
    }
    const entity = parseLittleTilesEntity(te, tables);
    if (entity) legacyEntities.push(entity);
    legacyCells.push(te.pos);
  }

  const cells = accumulateCells(legacyEntities, materialMap);

  const inBounds = (p: { x: number; y: number; z: number }) =>
    p.x >= 0 && p.y >= 0 && p.z >= 0 && p.x < width && p.y < height && p.z < length;

  for (const { pos, content } of cells.values()) {
    const tiles: Record<string, Int32Array[]> = {};
    for (const [state, list] of content.tilesByState) tiles[state] = list;
    tileEntities.push({
      pos,
      id: "littletiles:tiles",
      data: {
        id: "littletiles:tiles",
        grid: content.grid,
        content: { tiles, children: [] },
      },
    });

    if (!inBounds(pos)) continue;
    if (hostIdx === -1) {
      hostIdx = paletteIndexOf(
        (b) => b.id === "littletiles:tiles",
        () => parseBlockState("littletiles:tiles")
      );
      palette[hostIdx] = { ...palette[hostIdx], states: { waterlogged: "false" } };
    }
    blockData[(pos.y * length + pos.z) * width + pos.x] = hostIdx;
  }

  // A legacy host whose tiles all moved elsewhere (a structure master) or were
  // resolved to air has nothing left to render — leaving the host block there
  // would paste an empty LittleTiles block into the world.
  for (const pos of legacyCells) {
    if (!inBounds(pos) || cells.has(`${pos.x},${pos.y},${pos.z}`)) continue;
    if (airIdx === -1) {
      airIdx = paletteIndexOf(
        (b) => b.name === "air",
        () => parseBlockState("minecraft:air")
      );
    }
    blockData[(pos.y * length + pos.z) * width + pos.x] = airIdx;
  }

  return { ...structure, palette, blockData, tileEntities };
}
