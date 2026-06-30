import type { SchematicStructure, UnifiedBlock, TileEntity } from "../../types";
import { serializeBlockState } from "../normalizer";

/**
 * A single block entry in a Hytale `.prefab.json` file.
 * Coordinates are absolute (anchor-relative); `name` is the block type, with a
 * handful of optional placement fields.
 */
interface PrefabBlock {
  x: number;
  y: number;
  z: number;
  name: string;
  /** Orientation index (0–11), block-shape dependent. */
  rotation?: number;
  /** Neighbour-support bitmask for plants/attachments. */
  support?: number;
  /** Multi-block "filler" bitmask for furniture spanning several cells. */
  filler?: number;
  /** Block-entity-like payload (containers, beds, benches, placed-by, …). */
  components?: Record<string, unknown>;
}

interface PrefabFile {
  version?: number;
  blockIdVersion?: number;
  anchorX?: number;
  anchorY?: number;
  anchorZ?: number;
  blocks: PrefabBlock[];
}

const AIR_ID = "hytale:air";

/** Hytale's "no block here" sentinel. */
function isEmpty(name: string): boolean {
  return name === "Empty" || name === "";
}

/**
 * Normalize a raw Hytale prefab block name into a base id + extracted states.
 *
 * Hytale encodes block-state placements directly in the name:
 *   "*Wood_Village_Wall_Full_State_Definitions_Bottom"
 *     → base "Wood_Village_Wall_Full", state { state: "Bottom" }
 * The leading "*" marks a state-variant placement and the
 * "_State_Definitions_<Label>" suffix carries the variant. Both are stripped to
 * the canonical block name (which matches the asset catalog / registry) and the
 * label preserved as a `state` property so it round-trips back on export.
 */
function parseName(raw: string): { base: string; state?: string } {
  let name = raw;
  if (name.startsWith("*")) name = name.slice(1);
  const marker = "_State_Definitions_";
  const idx = name.indexOf(marker);
  if (idx !== -1) {
    return { base: name.slice(0, idx), state: name.slice(idx + marker.length) };
  }
  return { base: name };
}

/** Build the {@link UnifiedBlock} for a prefab block, baking placement into states. */
function toUnifiedBlock(b: PrefabBlock): UnifiedBlock {
  if (isEmpty(b.name)) {
    return { id: AIR_ID, namespace: "hytale", name: "air", states: {}, tags: [], source: "vanilla" };
  }
  const { base, state } = parseName(b.name);
  const states: Record<string, string> = {};
  if (state) states.state = state;
  if (b.rotation != null && b.rotation !== 0) states.rotation = String(b.rotation);
  if (b.support != null) states.support = String(b.support);
  if (b.filler != null) states.filler = String(b.filler);
  return {
    id: `hytale:${base}`,
    namespace: "hytale",
    name: base,
    states,
    tags: [],
    source: "vanilla",
  };
}

/**
 * Load a Hytale `.prefab.json` into the engine's neutral
 * {@link SchematicStructure}.
 *
 * The prefab is a sparse list of absolute-coordinate blocks; we compute its
 * bounding box, lay the blocks into a dense YZX `blockData` grid (matching every
 * other loader), and key the palette on the full block + placement so per-block
 * rotation/support/filler survive round-trips. `components` become tile entities
 * keyed by local position. Original anchor + format versions are kept in
 * `metadata` so the exporter can reproduce the file faithfully.
 */
export function loadPrefab(buffer: Uint8Array, fileName: string): SchematicStructure {
  const text = new TextDecoder().decode(buffer);
  const json = JSON.parse(text) as PrefabFile;
  const blocks = Array.isArray(json.blocks) ? json.blocks : [];

  if (blocks.length === 0) {
    throw new Error("Prefab contains no blocks.");
  }

  // Bounding box over all entries (including Empty — the grid must cover them).
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const b of blocks) {
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.z < minZ) minZ = b.z;
    if (b.x > maxX) maxX = b.x;
    if (b.y > maxY) maxY = b.y;
    if (b.z > maxZ) maxZ = b.z;
  }

  const sx = maxX - minX + 1;
  const sy = maxY - minY + 1;
  const sz = maxZ - minZ + 1;

  // Palette: air is always index 0 so unfilled cells default to air.
  const palette: UnifiedBlock[] = [
    { id: AIR_ID, namespace: "hytale", name: "air", states: {}, tags: [], source: "vanilla" },
  ];
  const paletteIndex = new Map<string, number>([[AIR_ID, 0]]);

  const blockData = new Int32Array(sx * sy * sz); // zero-filled → all air
  const tileEntities: TileEntity[] = [];

  for (const b of blocks) {
    const lx = b.x - minX;
    const ly = b.y - minY;
    const lz = b.z - minZ;
    const li = (ly * sz + lz) * sx + lx;

    const unified = toUnifiedBlock(b);
    if (unified.id !== AIR_ID) {
      const key = serializeBlockState(unified);
      let pi = paletteIndex.get(key);
      if (pi === undefined) {
        pi = palette.length;
        palette.push(unified);
        paletteIndex.set(key, pi);
      }
      blockData[li] = pi;

      if (b.components && Object.keys(b.components).length > 0) {
        tileEntities.push({
          pos: { x: lx, y: ly, z: lz },
          id: unified.name,
          data: b.components,
        });
      }
    }
  }

  return {
    format: "prefab",
    formatVersion: json.version ?? 8,
    dimensions: { x: sx, y: sy, z: sz },
    palette,
    blockData,
    tileEntities,
    entities: [],
    metadata: {
      gameId: "hytale",
      fileName,
      anchor: { x: json.anchorX ?? 0, y: json.anchorY ?? 0, z: json.anchorZ ?? 0 },
      origin: { x: minX, y: minY, z: minZ },
      blockIdVersion: json.blockIdVersion ?? 11,
    },
  };
}
