/**
 * The game-agnostic half of the schematic worker: loading environments and
 * structures, resolving a block's texture/geometry, and building the 3D
 * preview's instance data.
 *
 * These are plain functions over an explicit {@link SchematicEngineState}, not a
 * worker entry point — every worker that needs them (the converter, a read-only
 * viewer) owns its own `expose()` and picks the subset it exposes. Conversion
 * ops (diff, resolutions, export, rule sets) deliberately live with the tool
 * that performs conversions, not here.
 */
import type {
  BlockRegistry,
  SchematicStructure,
  RegistryHandle,
  SchematicSummary,
  BlockPositionGroup,
  ProgressCb,
  LegacyIdMap,
  LittleTilesGroup,
  LittleTilesStructure,
  WorldIdSummary,
} from "../types";
import { parseLevelDat } from "../loader/level-dat";
import type { CompiledModel } from "../model/types";
import { getAdapter, adapterForFile, type GameId } from "../adapters";
import type { BuildRegistryOptions } from "../adapters";
import { loadBundledRegistry } from "../registry";

/**
 * The worker's caches. The worker is STATEFUL: registries and structures stay
 * inside it and the UI references them by id, so large block arrays and registry
 * maps never cross the postMessage boundary.
 */
export interface SchematicEngineState {
  registries: Map<string, BlockRegistry>;
  schematics: Map<string, SchematicStructure>;
  /**
   * Block-id table of the pre-1.13 world the user attached, applied to every
   * subsequent legacy load. Kept worker-side so a 2 700-entry map is sent in
   * once instead of riding along with each parse call.
   */
  worldIds?: LegacyIdMap;
  nextId: (prefix: string) => string;
}

export function createEngineState(): SchematicEngineState {
  let counter = 0;
  return {
    registries: new Map(),
    schematics: new Map(),
    nextId: (prefix: string) => `${prefix}-${++counter}`,
  };
}

export function registryHandle(id: string, reg: BlockRegistry): RegistryHandle {
  return {
    id,
    gameId: reg.gameId,
    version: reg.version,
    dataVersion: reg.dataVersion,
    modLoader: reg.modLoader,
    mods: reg.mods,
    blockCount: reg.blocks.size,
    textureCount: reg.textures?.size ?? 0,
    failedJars: reg.failedJars,
    source: reg.snapshotHash.startsWith("vanilla-") ? "bundled" : "scanned",
    instanceName: reg.instanceName,
  };
}

/** `metadata` is untyped NBT-derived data, so validate before it crosses Comlink. */
function asVec3(v: unknown): { x: number; y: number; z: number } | undefined {
  if (!v || typeof v !== "object") return undefined;
  const { x, y, z } = v as Record<string, unknown>;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return undefined;
  return { x: x as number, y: y as number, z: z as number };
}

export function schematicSummary(
  id: string,
  s: SchematicStructure,
  fileName: string,
  fileSize: number,
): SchematicSummary {
  const unknownIds = s.metadata.unknownLegacyIds;
  const legacy = s.format === "mcedit" || s.metadata.legacy === true;
  const origin = asVec3(s.metadata.origin);
  const offset = asVec3(s.metadata.offset);
  return {
    id,
    format: s.format,
    formatVersion: s.formatVersion,
    dimensions: s.dimensions,
    paletteSize: s.palette.length,
    blockCount: s.dimensions.x * s.dimensions.y * s.dimensions.z,
    fileName,
    fileSize,
    ...(legacy
      ? { legacy, unknownIdCount: Array.isArray(unknownIds) ? unknownIds.length : 0 }
      : {}),
    ...(s.littleTiles
      ? { littleTiles: { blockCount: s.littleTiles.blockCount, tileCount: s.littleTiles.tileCount } }
      : {}),
    ...(origin ? { origin } : {}),
    ...(offset ? { offset } : {}),
  };
}

export async function ping(): Promise<"pong"> {
  return "pong";
}

export async function scanInstance(
  state: SchematicEngineState,
  gameId: GameId,
  files: File[],
  onProgress: ProgressCb,
  options?: BuildRegistryOptions,
): Promise<RegistryHandle> {
  const reg = await getAdapter(gameId).buildRegistry(files, onProgress, options);
  const id = state.nextId("reg");
  state.registries.set(id, reg);
  return registryHandle(id, reg);
}

export async function loadVanillaRegistry(
  state: SchematicEngineState,
  version: string,
): Promise<RegistryHandle> {
  // No instance to scan — the bundled vanilla registry IS the environment.
  // Analysis never needed a folder (computeDiff only reads the source
  // registry's gameId; classification is namespace-based), so this is a
  // first-class environment, not a degraded one.
  const reg = await loadBundledRegistry(version);
  const id = state.nextId("reg");
  state.registries.set(id, reg);
  return registryHandle(id, reg);
}

export async function getBlockTexture(
  state: SchematicEngineState,
  registryId: string,
  blockId: string,
  meta?: number,
): Promise<string | null> {
  const reg = state.registries.get(registryId);
  if (!reg) return null;
  // A pre-flattening block carries its variant as metadata, which indexes the
  // per-variant list — without this every metadata value of a block shows
  // variant 0 (all crystals white, every roof tile the first colour).
  if (meta !== undefined && meta > 0) {
    const variant = reg.variantTextures?.get(blockId)?.[meta];
    if (variant) return variant;
  }
  // Prebuilt textures (Minecraft mod JARs) first, then a lazy resolver if the
  // game extracts on demand (Hytale pulls the icon out of Assets.zip here).
  return reg.textures?.get(blockId) ?? (await reg.getTexture?.(blockId)) ?? null;
}

export async function getBlockModel(
  state: SchematicEngineState,
  registryId: string,
  blockId: string,
  stateLabel?: string,
  rotation?: number,
): Promise<CompiledModel | null> {
  const reg = state.registries.get(registryId);
  if (!reg?.getModel) return null;
  // Compiled geometry (plain typed arrays) → safe to clone across postMessage.
  return (await reg.getModel(blockId, stateLabel, rotation)) ?? null;
}

export async function loadSchematic(
  state: SchematicEngineState,
  file: File,
): Promise<SchematicSummary> {
  const structure = await adapterForFile(file.name).parseSchematic(file, {
    worldIds: state.worldIds,
  });
  const id = state.nextId("schem");
  state.schematics.set(id, structure);
  return schematicSummary(id, structure, file.name, file.size);
}

/**
 * Attach a pre-1.13 world's `level.dat`, so legacy loads can name that world's
 * modded blocks. Applies to schematics loaded *after* this call — the ids are
 * baked into a structure's palette at parse time.
 */
export async function loadWorldIds(
  state: SchematicEngineState,
  file: File,
): Promise<WorldIdSummary> {
  const table = parseLevelDat(new Uint8Array(await file.arrayBuffer()));
  state.worldIds = table.ids;
  let moddedCount = 0;
  for (const id of table.ids.keys()) if (id > 255) moddedCount++;
  return {
    idCount: table.ids.size,
    moddedCount,
    worldName: table.worldName,
    modCount: table.modCount,
    source: table.source,
  };
}

/** Detach the world id table; later legacy loads fall back to unknown ids. */
export async function clearWorldIds(state: SchematicEngineState): Promise<void> {
  state.worldIds = undefined;
}

/** Per-material LittleTiles micro-box groups; empty when the schematic has none. */
export async function getLittleTileBoxes(
  state: SchematicEngineState,
  schematicId: string,
): Promise<LittleTilesGroup[]> {
  const structure = state.schematics.get(schematicId);
  if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
  return structure.littleTiles?.groups ?? [];
}

/** LittleTiles structure instances; empty when the schematic has none. */
export async function getLittleTileStructures(
  state: SchematicEngineState,
  schematicId: string,
): Promise<LittleTilesStructure[]> {
  const structure = state.schematics.get(schematicId);
  if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
  return structure.littleTiles?.structures ?? [];
}

export async function release(state: SchematicEngineState, id: string): Promise<void> {
  state.registries.delete(id);
  state.schematics.delete(id);
}

export async function getSchematicBlockPositions(
  state: SchematicEngineState,
  schematicId: string,
): Promise<BlockPositionGroup[]> {
  // Every cell is classified as surface (≥1 open neighbour / volume edge) or
  // interior (fully enclosed). Surface cells always render; interior cells go
  // into a separate per-group array the viewer only draws at the active
  // Y-slice, which is the only moment slicing can expose them. Past this many
  // *renderable* (non-air) blocks, interiors are dropped entirely — a 500³
  // solid build is 125M blocks but only ~1.5M surface cells, so this is what
  // makes very large schematics fit in memory at all (the layer slider then
  // shows a hollow shell, the accepted trade-off for that size).
  const CULL_THRESHOLD = 1_500_000;
  // Hard cap on always-rendered instances handed to the GPU; if the surface
  // itself is larger we stride within each block group as a last resort.
  const MAX_INSTANCES = 2_000_000;

  const structure = state.schematics.get(schematicId);
  if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
  const { x: sx, y: sy, z: sz } = structure.dimensions;
  const data = structure.blockData;
  const palLen = structure.palette.length;
  const sxsz = sx * sz;

  // air (or out-of-range) palette indices → treated as empty space. LittleTiles
  // host blocks also count as empty: their visual content is the parsed
  // micro-boxes (getLittleTileBoxes), and an opaque cube would occlude them.
  const airFlags = new Uint8Array(palLen);
  for (let i = 0; i < palLen; i++) {
    const block = structure.palette[i];
    if (block.id === "air" || block.id.endsWith(":air")) airFlags[i] = 1;
    else if (structure.littleTiles && block.namespace === "littletiles") airFlags[i] = 1;
  }
  // A neighbour cell is "open" when it's air or an invalid index (undefined
  // airFlags lookup → NaN-ish, so `!== 0` covers both air and out-of-range).
  const open = (li: number): boolean => airFlags[data[li]] !== 0;
  // A cell is on the visible surface when it touches the volume edge or any of
  // its six neighbours is open.
  const exposed = (xi: number, yi: number, zi: number, li: number): boolean =>
    xi === 0 || yi === 0 || zi === 0 || xi === sx - 1 || yi === sy - 1 || zi === sz - 1 ||
    open(li - 1) || open(li + 1) ||
    open(li - sx) || open(li + sx) ||
    open(li - sxsz) || open(li + sxsz);

  // Pass A — count renderable blocks; decides whether interiors are dropped.
  let nonAir = 0;
  for (let li = 0; li < data.length; li++) {
    if (airFlags[data[li]] === 0) nonAir++;
  }
  const keepInterior = nonAir <= CULL_THRESHOLD;

  // Pass B — count surface/interior instances per palette index (Y-outer so
  // the fill pass writes Y-sorted positions, which the UI binary-searches for
  // both the layer cutoff and the interior slice window).
  const surfCounts = new Uint32Array(palLen);
  const intCounts = new Uint32Array(palLen);
  for (let yi = 0; yi < sy; yi++) {
    for (let zi = 0; zi < sz; zi++) {
      const row = (yi * sz + zi) * sx;
      for (let xi = 0; xi < sx; xi++) {
        const li = row + xi;
        const pi = data[li];
        if (airFlags[pi] !== 0) continue; // air / invalid
        if (exposed(xi, yi, zi, li)) surfCounts[pi]++;
        else if (keepInterior) intCounts[pi]++;
      }
    }
  }

  let total = 0;
  for (let i = 0; i < palLen; i++) total += surfCounts[i];
  const stride = total > MAX_INSTANCES ? Math.ceil(total / MAX_INSTANCES) : 1;

  // Exact-size typed arrays, no boxed number[][] intermediates (the old path
  // allocated ~3 JS numbers per block — gigabytes on a large solid schematic).
  const surfBufs: (Float32Array | null)[] = new Array(palLen).fill(null);
  const intBufs: (Float32Array | null)[] = new Array(palLen).fill(null);
  for (let i = 0; i < palLen; i++) {
    if (surfCounts[i] > 0) surfBufs[i] = new Float32Array(surfCounts[i] * 3);
    if (intCounts[i] > 0) intBufs[i] = new Float32Array(intCounts[i] * 3);
  }
  const surfCursor = new Uint32Array(palLen);
  const intCursor = new Uint32Array(palLen);

  // Pass C — fill positions.
  for (let yi = 0; yi < sy; yi++) {
    for (let zi = 0; zi < sz; zi++) {
      const row = (yi * sz + zi) * sx;
      for (let xi = 0; xi < sx; xi++) {
        const li = row + xi;
        const pi = data[li];
        if (airFlags[pi] !== 0) continue;
        let buf: Float32Array;
        let c: number;
        if (exposed(xi, yi, zi, li)) {
          buf = surfBufs[pi]!;
          c = surfCursor[pi];
          surfCursor[pi] = c + 3;
        } else if (keepInterior) {
          buf = intBufs[pi]!;
          c = intCursor[pi];
          intCursor[pi] = c + 3;
        } else continue;
        buf[c] = xi;
        buf[c + 1] = yi;
        buf[c + 2] = zi;
      }
    }
  }

  const groups: BlockPositionGroup[] = [];
  for (let i = 0; i < palLen; i++) {
    const surf = surfBufs[i];
    const interior = intBufs[i];
    if (!surf && !interior) continue;
    let positions = surf ?? new Float32Array(0);
    if (surf && stride > 1) {
      const n = surf.length / 3;
      const kept = new Float32Array(Math.ceil(n / stride) * 3);
      let w = 0;
      for (let j = 0; j < n; j += stride) {
        kept[w++] = surf[j * 3];
        kept[w++] = surf[j * 3 + 1];
        kept[w++] = surf[j * 3 + 2];
      }
      positions = kept;
    }
    groups.push({
      paletteIndex: i,
      block: structure.palette[i],
      positions,
      ...(interior ? { interiorPositions: interior } : {}),
    });
  }
  return groups;
}
