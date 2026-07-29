import { expose } from "comlink";
import type { CompatWorkerAPI } from "./worker-api";
import { serializeBlockState } from "@/lib/schematic/normalizer";
import { convertLittleTilesForExport } from "../pipeline/exporter/littletiles-writer";
import type {
  BlockRegistry,
  BlockDefinition,
  SchematicStructure,
  UnifiedBlock,
  RegistryHandle,
  SchematicSummary,
  WorldIdSummary,
  LittleTilesGroup,
  CompatDiff,
  ResolutionMap,
  RuleSet,
  RuleSetMeta,
  DiffEntry,
  BlockPositionGroup,
  ProgressCb,
  ScanOverride,
  ExportFormat,
} from "@/lib/schematic/types";
import {
  createEngineState,
  type SchematicEngineState,
} from "@/lib/schematic/worker/core-ops";
import * as core from "@/lib/schematic/worker/core-ops";
import { getAdapter, adapterForFormat, adapterForNamespace, type GameId } from "@/lib/schematic/adapters";
import { computeDiff } from "../pipeline/diff";
import { applyRules } from "../pipeline/rules/engine";
import { transformStates } from "../pipeline/state/transformer";
import { buildRuleSet, parseRuleSet } from "../pipeline/rules/ruleset";
import { crossGameTargetIds } from "../pipeline/rules/cross-game";
import { bridgeRotationStates, isRedundantDoorHalf } from "../pipeline/rules/cross-game/rotation";
import { exportStructure } from "../pipeline/exporter";

// The engine half (scan / parse / texture / model / positions) lives in
// `@/lib/schematic/worker/core-ops` and is shared with any other schematic
// worker. Only the conversion ops below are specific to this tool.
const state: SchematicEngineState = createEngineState();

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

/**
 * Cross-game exports must not leak the other game's blocks. Any palette entry
 * that isn't the target game — i.e. it was never mapped to a target-game block
 * during conversion — is replaced with the target game's air so it's simply
 * omitted from the written file instead of emitted with a foreign id (which is
 * meaningless to the other game and how `minecraft:` ids ended up in a Hytale
 * prefab). Same-game exports change nothing (every block already matches).
 */
function stripForeignBlocks(structure: SchematicStructure, targetGame: GameId): SchematicStructure {
  const air = getAdapter(targetGame).airBlock();
  let changed = false;
  const palette = structure.palette.map((b) => {
    if (b.name === "air" || adapterForNamespace(b.namespace).gameId === targetGame) return b;
    changed = true;
    return air;
  });
  return changed ? { ...structure, palette } : structure;
}

const api: CompatWorkerAPI = {
  ping: () => core.ping(),

  scanInstance(
    gameId: GameId,
    files: File[],
    onProgress: ProgressCb,
    override?: ScanOverride,
  ): Promise<RegistryHandle> {
    // The cross-game rule table decides which target blocks must resolve; the
    // registry builder is handed the ids and never reads the table itself.
    return core.scanInstance(state, gameId, files, onProgress, {
      override,
      requiredBlockIds: crossGameTargetIds(gameId),
    });
  },

  loadVanillaRegistry: (version: string) => core.loadVanillaRegistry(state, version),

  getBlockTexture: (registryId: string, blockId: string, meta?: number) =>
    core.getBlockTexture(state, registryId, blockId, meta),

  getBlockModel: (registryId: string, blockId: string, stateLabel?: string, rotation?: number) =>
    core.getBlockModel(state, registryId, blockId, stateLabel, rotation),

  loadSchematic: (file: File): Promise<SchematicSummary> => core.loadSchematic(state, file),

  loadWorldIds: (file: File): Promise<WorldIdSummary> => core.loadWorldIds(state, file),

  clearWorldIds: (): Promise<void> => core.clearWorldIds(state),

  getSchematicBlockPositions: (schematicId: string): Promise<BlockPositionGroup[]> =>
    core.getSchematicBlockPositions(state, schematicId),

  getLittleTileBoxes: (schematicId: string): Promise<LittleTilesGroup[]> =>
    core.getLittleTileBoxes(state, schematicId),

  release: (id: string) => core.release(state, id),

  async getRegistryBlockIds(registryId: string): Promise<string[]> {
    const reg = state.registries.get(registryId);
    if (!reg) throw new Error(`Registry not found: ${registryId}`);
    return [...reg.blocks.keys()].sort();
  },

  async getBlockConnections(registryId: string, blockId: string) {
    // A connected block's shape map (fence/bars/wall). Plain data — the 3D
    // preview uses it to resolve a converted block's corner/T/cross variant the
    // same way the export path does (target block defs otherwise stay in the
    // worker). `null` for non-connected blocks, so the preview leaves them as-is.
    return state.registries.get(registryId)?.blocks.get(blockId)?.connections ?? null;
  },

  async computeDiff(
    schematicId: string,
    sourceRegId: string,
    targetRegId: string
  ): Promise<CompatDiff> {
    const structure = state.schematics.get(schematicId);
    if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
    const sourceReg = state.registries.get(sourceRegId);
    if (!sourceReg) throw new Error(`Source registry not found: ${sourceRegId}`);
    const targetReg = state.registries.get(targetRegId);
    if (!targetReg) throw new Error(`Target registry not found: ${targetRegId}`);
    return computeDiff(structure, sourceReg, targetReg);
  },

  async applyResolutions(
    schematicId: string,
    resolutions: ResolutionMap,
    ruleSets: RuleSet[],
    targetRegId: string
  ): Promise<{ schematicId: string; remaining: DiffEntry[] }> {
    const structure = state.schematics.get(schematicId);
    if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
    const targetReg = state.registries.get(targetRegId);
    if (!targetReg) throw new Error(`Target registry not found: ${targetRegId}`);
    const targetAdapter = getAdapter(targetReg.gameId);

    // Step 1: apply explicit per-block-id resolutions
    let newPalette = structure.palette.map((block) => {
      // A two-block Minecraft door's upper half has nothing to become: Hytale's
      // door model already spans both cells from the lower placement. Force it
      // to air regardless of how (or whether) the base door id was resolved.
      if (isRedundantDoorHalf(block, targetReg.gameId)) return targetAdapter.airBlock();
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

    const newId = state.nextId("schem");
    // Resolutions on LittleTiles material entries can't rewrite the palette
    // (materials live inside TE NBT) — record them for the export writer.
    let littleTiles = structure.littleTiles;
    if (littleTiles) {
      const materialMap: Record<string, string> = { ...littleTiles.materialMap };
      for (const group of littleTiles.groups) {
        const res = resolutions[group.block.id];
        if (res) materialMap[group.block.id] = serializeBlockState(res.target);
      }
      if (Object.keys(materialMap).length > 0) littleTiles = { ...littleTiles, materialMap };
    }

    const newStructure: SchematicStructure = { ...structure, palette: newPalette, littleTiles };
    state.schematics.set(newId, newStructure);

    // Re-diff the modified schematic against the target registry
    const diff = computeDiff(newStructure, targetReg, targetReg);
    const remaining = diff.entries.filter((e) => e.status !== "safe");

    return { schematicId: newId, remaining };
  },

  async export(schematicId: string, format: ExportFormat, dataVersion?: number): Promise<Blob> {
    let structure = state.schematics.get(schematicId);
    if (!structure) throw new Error(`Schematic not found: ${schematicId}`);
    // Legacy LittleTiles content converts to the modern mod format on .schem
    // exports (the WorldEdit-paste flow); other formats leave the TEs alone.
    // Runs before the foreign-block strip so the re-stamped host cells are what
    // that pass sees.
    if (format === "schem" || format === "schem3") {
      structure = await convertLittleTilesForExport(structure);
    }
    const targetGame = adapterForFormat(format).gameId;
    // Drop any block still foreign to the target game (unmapped in a cross-game
    // conversion) so its source id never lands in the written file.
    let cleaned = stripForeignBlocks(structure, targetGame);
    // Stamp the TARGET environment's save-format version. Without this the
    // writers fall back to the source file's DataVersion and the export declares
    // the version it was converted *from* — the game then runs its data fixers
    // across ids that are already in the target's format.
    if (dataVersion !== undefined) {
      cleaned = { ...cleaned, metadata: { ...cleaned.metadata, dataVersion } };
    }
    const out = exportStructure(cleaned, format);
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
