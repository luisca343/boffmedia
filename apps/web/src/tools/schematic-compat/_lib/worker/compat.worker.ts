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
    const MAX_INSTANCES = 600_000;
    const structure = schematics.get(schematicId);
    if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
    const { x: sx, y: sy, z: sz } = structure.dimensions;

    // Build per-palette arrays. Outer loop is yi so positions are Y-sorted
    // within each group — enables binary-search Y-layer cutoff in the UI.
    const posArrays: number[][] = structure.palette.map(() => []);
    for (let yi = 0; yi < sy; yi++) {
      for (let zi = 0; zi < sz; zi++) {
        for (let xi = 0; xi < sx; xi++) {
          const li = (yi * sz + zi) * sx + xi;
          const pi = structure.blockData[li];
          if (pi < 0 || pi >= structure.palette.length) continue;
          const { id } = structure.palette[pi];
          if (id.endsWith(":air") || id === "air") continue;
          posArrays[pi].push(xi, yi, zi);
        }
      }
    }

    const totalInstances = posArrays.reduce((s, a) => s + a.length / 3, 0);
    const stride = totalInstances > MAX_INSTANCES ? Math.ceil(totalInstances / MAX_INSTANCES) : 1;

    return structure.palette
      .map((block, i) => {
        const src = posArrays[i];
        if (src.length === 0) return null;

        let positions: Float32Array;
        if (stride > 1) {
          const count = src.length / 3;
          const kept: number[] = [];
          for (let j = 0; j < count; j += stride) {
            kept.push(src[j * 3], src[j * 3 + 1], src[j * 3 + 2]);
          }
          positions = new Float32Array(kept);
        } else {
          positions = new Float32Array(src);
        }

        return { paletteIndex: i, block, positions };
      })
      .filter((g): g is BlockPositionGroup => g !== null && g.positions.length > 0);
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
    const bytes = getAdapter(targetGame).export(cleaned, format);
    return new Blob([bytes as BlobPart], { type: "application/octet-stream" });
  },

  async importRuleSet(json: string): Promise<RuleSet> {
    return parseRuleSet(json);
  },

  async exportRuleSet(resolutions: ResolutionMap, meta: RuleSetMeta): Promise<string> {
    return buildRuleSet(resolutions, meta);
  },
};

expose(api);
