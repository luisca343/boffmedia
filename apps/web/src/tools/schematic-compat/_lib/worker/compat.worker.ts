import { expose } from "comlink";
import type { CompatWorkerAPI } from "./worker-api";
import type {
  BlockRegistry,
  BlockDefinition,
  SchematicStructure,
  UnifiedBlock,
  RegistryHandle,
  SchematicSummary,
  CompatDiff,
  ResolutionMap,
  RuleSet,
  RuleSetMeta,
  DiffEntry,
  BlockPositionGroup,
  ProgressCb,
} from "../types";
import { computeDiff } from "../pipeline/diff";
import { applyRules } from "../pipeline/rules/engine";
import { transformStates } from "../pipeline/state/transformer";
import { buildRuleSet, parseRuleSet } from "../pipeline/rules/ruleset";
import { bridgeRotationStates, isRedundantDoorHalf } from "../pipeline/rules/cross-game/rotation";
import { getAdapter, type GameId } from "../adapters";
import type { ExportFormat } from "../pipeline/exporter";

// All game-specific work (scan / parse / export) goes through a per-game adapter.
// The engine itself stays game-agnostic — it only sees UnifiedBlock /
// BlockRegistry / SchematicStructure.

/** Pick the adapter for a schematic file by extension (Hytale prefab vs Minecraft). */
function adapterForFile(fileName: string): GameId {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".prefab.json") || lower.endsWith(".prefab") ? "hytale" : "minecraft";
}

/** Pick the adapter for an export by format (prefab → Hytale, else Minecraft). */
function adapterForFormat(format: ExportFormat): GameId {
  return format === "prefab" ? "hytale" : "minecraft";
}

/** Which game a block belongs to (Hytale ids are namespaced, everything else is MC). */
function blockGameOf(block: UnifiedBlock): GameId {
  return block.namespace === "hytale" ? "hytale" : "minecraft";
}

/**
 * The block definition `transformStates` should key off after a bridge. Normally
 * this is the resolved `targetDef`, but a connected block (fence/bars/wall) can
 * re-target to a shape-specific variant block — `bridgeRotationStates` signals
 * that by changing the id — so we resolve that variant's def instead.
 */
function effectiveDef(
  bridged: UnifiedBlock,
  source: UnifiedBlock,
  targetDef: BlockDefinition,
  targetReg: BlockRegistry,
): BlockDefinition {
  if (bridged.id === source.id) return targetDef;
  return targetReg.blocks.get(bridged.id) ?? targetDef;
}

function airBlock(game: GameId): UnifiedBlock {
  return game === "hytale"
    ? { id: "hytale:air", namespace: "hytale", name: "air", states: {}, tags: [], source: "vanilla" }
    : { id: "minecraft:air", namespace: "minecraft", name: "air", states: {}, tags: [], source: "vanilla" };
}

/**
 * Cross-game exports must not leak the other game's blocks. Any palette entry
 * that isn't the target game — i.e. it was never mapped to a target-game block
 * during conversion — is replaced with the target game's air so it's simply
 * omitted from the written file instead of emitted with a foreign id (which is
 * meaningless to the other game and how `minecraft:` ids ended up in a Hytale
 * prefab). Same-game exports change nothing (every block already matches).
 */
function stripForeignBlocks(structure: SchematicStructure, targetGame: GameId): SchematicStructure {
  const air = airBlock(targetGame);
  let changed = false;
  const palette = structure.palette.map((b) => {
    if (b.name === "air" || blockGameOf(b) === targetGame) return b;
    changed = true;
    return air;
  });
  return changed ? { ...structure, palette } : structure;
}

// ─── In-worker caches ──────────────────────────────────────────────────────────

const registries = new Map<string, BlockRegistry>();
const schematics = new Map<string, SchematicStructure>();
let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

function registryHandle(id: string, reg: BlockRegistry): RegistryHandle {
  return {
    id,
    gameId: reg.gameId,
    version: reg.version,
    modLoader: reg.modLoader,
    mods: reg.mods,
    blockCount: reg.blocks.size,
    source: reg.snapshotHash.startsWith("vanilla-") ? "bundled" : "scanned",
    instanceName: reg.instanceName,
  };
}

function schematicSummary(
  id: string,
  s: SchematicStructure,
  fileName: string,
  fileSize: number
): SchematicSummary {
  return {
    id,
    format: s.format,
    formatVersion: s.formatVersion,
    dimensions: s.dimensions,
    paletteSize: s.palette.length,
    blockCount: s.dimensions.x * s.dimensions.y * s.dimensions.z,
    fileName,
    fileSize,
  };
}

// ─── API ────────────────────────────────────────────────────────────────────────

const api: CompatWorkerAPI = {
  async ping() {
    return "pong";
  },

  async scanInstance(
    gameId: GameId,
    files: File[],
    onProgress: ProgressCb
  ): Promise<RegistryHandle> {
    const reg = await getAdapter(gameId).buildRegistry(files, onProgress);
    const id = nextId("reg");
    registries.set(id, reg);
    return registryHandle(id, reg);
  },

  async getRegistryBlockIds(registryId: string): Promise<string[]> {
    const reg = registries.get(registryId);
    if (!reg) throw new Error(`Registry not found: ${registryId}`);
    return [...reg.blocks.keys()].sort();
  },

  async getBlockTexture(registryId: string, blockId: string): Promise<string | null> {
    const reg = registries.get(registryId);
    if (!reg) return null;
    // Prebuilt textures (Minecraft mod JARs) first, then a lazy resolver if the
    // game extracts on demand (Hytale pulls the icon out of Assets.zip here).
    return reg.textures?.get(blockId) ?? (await reg.getTexture?.(blockId)) ?? null;
  },

  async getBlockModel(registryId: string, blockId: string, stateLabel?: string, rotation?: number) {
    const reg = registries.get(registryId);
    if (!reg?.getModel) return null;
    // Compiled geometry (plain typed arrays) → safe to clone across postMessage.
    return (await reg.getModel(blockId, stateLabel, rotation)) ?? null;
  },

  async getBlockConnections(registryId: string, blockId: string) {
    // A connected block's shape map (fence/bars/wall). Plain data — the 3D
    // preview uses it to resolve a converted block's corner/T/cross variant the
    // same way the export path does (target block defs otherwise stay in the
    // worker). `null` for non-connected blocks, so the preview leaves them as-is.
    return registries.get(registryId)?.blocks.get(blockId)?.connections ?? null;
  },

  async loadSchematic(file: File): Promise<SchematicSummary> {
    const structure = await getAdapter(adapterForFile(file.name)).parseSchematic(file);
    const id = nextId("schem");
    schematics.set(id, structure);
    return schematicSummary(id, structure, file.name, file.size);
  },

  async computeDiff(
    schematicId: string,
    sourceRegId: string,
    targetRegId: string
  ): Promise<CompatDiff> {
    const structure = schematics.get(schematicId);
    if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
    const sourceReg = registries.get(sourceRegId);
    if (!sourceReg) throw new Error(`Source registry not found: ${sourceRegId}`);
    const targetReg = registries.get(targetRegId);
    if (!targetReg) throw new Error(`Target registry not found: ${targetRegId}`);
    return computeDiff(structure, sourceReg, targetReg);
  },

  async release(id: string): Promise<void> {
    registries.delete(id);
    schematics.delete(id);
  },

  async getSchematicBlockPositions(schematicId: string): Promise<BlockPositionGroup[]> {
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

    const structure = schematics.get(schematicId);
    if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
    const { x: sx, y: sy, z: sz } = structure.dimensions;
    const data = structure.blockData;
    const palLen = structure.palette.length;
    const sxsz = sx * sz;

    // air (or out-of-range) palette indices → treated as empty space.
    const airFlags = new Uint8Array(palLen);
    for (let i = 0; i < palLen; i++) {
      const id = structure.palette[i].id;
      if (id === "air" || id.endsWith(":air")) airFlags[i] = 1;
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
  },

  // ── Phase 2 ───────────────────────────────────────────────────────────────
  async applyResolutions(
    schematicId: string,
    resolutions: ResolutionMap,
    ruleSets: RuleSet[],
    targetRegId: string
  ): Promise<{ schematicId: string; remaining: DiffEntry[] }> {
    const structure = schematics.get(schematicId);
    if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
    const targetReg = registries.get(targetRegId);
    if (!targetReg) throw new Error(`Target registry not found: ${targetRegId}`);

    // Step 1: apply explicit per-block-id resolutions
    let newPalette = structure.palette.map((block) => {
      // A two-block Minecraft door's upper half has nothing to become: Hytale's
      // door model already spans both cells from the lower placement. Force it
      // to air regardless of how (or whether) the base door id was resolved.
      if (isRedundantDoorHalf(block, targetReg.gameId)) return airBlock(targetReg.gameId);
      const res = resolutions[block.id];
      if (!res) return block;
      const targetDef = targetReg.blocks.get(res.target.id);
      if (targetDef) {
        const bridged = bridgeRotationStates(block, targetReg.gameId, targetDef);
        return transformStates(bridged, effectiveDef(bridged, block, targetDef, targetReg), res.stateMap).block;
      }
      return res.target;
    });

    // Step 2: apply rule sets to still-unresolved blocks
    if (ruleSets.length > 0) {
      newPalette = newPalette.map((block) => {
        // Air (including the stand-in for a collapsed door half, which isn't in
        // the catalog) never needs a rule — and never wants one silently
        // reassigning it via a namespace/tag/fallback rule.
        if (block.name === "air" || targetReg.blocks.has(block.id)) return block;
        const candidate = applyRules(block, ruleSets, targetReg);
        if (!candidate) return block;
        const targetDef = targetReg.blocks.get(candidate.id);
        if (targetDef) {
          const bridged = bridgeRotationStates(block, targetReg.gameId, targetDef);
          return transformStates(bridged, effectiveDef(bridged, block, targetDef, targetReg)).block;
        }
        return candidate;
      });
    }

    const newId = nextId("schem");
    const newStructure: SchematicStructure = { ...structure, palette: newPalette };
    schematics.set(newId, newStructure);

    // Re-diff the modified schematic against the target registry
    const diff = computeDiff(newStructure, targetReg, targetReg);
    const remaining = diff.entries.filter((e) => e.status !== "safe");

    return { schematicId: newId, remaining };
  },

  async export(schematicId: string, format: ExportFormat): Promise<Blob> {
    const structure = schematics.get(schematicId);
    if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
    const targetGame = adapterForFormat(format);
    // Drop any block still foreign to the target game (unmapped in a cross-game
    // conversion) so its source id never lands in the written file.
    const cleaned = stripForeignBlocks(structure, targetGame);
    const out = getAdapter(targetGame).export(cleaned, format);
    // A writer may stream straight to a Blob (large prefabs); pass it through
    // rather than forcing its bytes back through a second in-memory copy.
    return out instanceof Blob ? out : new Blob([out as BlobPart], { type: "application/octet-stream" });
  },

  async importRuleSet(json: string): Promise<RuleSet> {
    return parseRuleSet(json);
  },

  async exportRuleSet(resolutions: ResolutionMap, meta: RuleSetMeta): Promise<string> {
    return buildRuleSet(resolutions, meta);
  },
};

expose(api);
