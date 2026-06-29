import { expose } from "comlink";
import type { CompatWorkerAPI } from "./worker-api";
import type {
  BlockRegistry,
  SchematicStructure,
  RegistryHandle,
  SchematicSummary,
  CompatDiff,
  ResolutionMap,
  RuleSet,
  RuleSetMeta,
  DiffEntry,
  ProgressCb,
} from "../types";
import { loadSchematicFile } from "../pipeline/loader";
import { buildScannedRegistry } from "../pipeline/registry";
import { computeDiff } from "../pipeline/diff";
import { applyRules } from "../pipeline/rules/engine";
import { transformStates } from "../pipeline/state/transformer";

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
    metaFiles: File[],
    jarFiles: File[],
    onProgress: ProgressCb
  ): Promise<RegistryHandle> {
    const reg = await buildScannedRegistry(metaFiles, jarFiles, onProgress);
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
    return reg?.textures?.get(blockId) ?? null;
  },

  async loadSchematic(file: File): Promise<SchematicSummary> {
    const structure = await loadSchematicFile(file);
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
      const res = resolutions[block.id];
      if (!res) return block;
      const targetDef = targetReg.blocks.get(res.target.id);
      if (targetDef) {
        return transformStates(block, targetDef, res.stateMap).block;
      }
      return res.target;
    });

    // Step 2: apply rule sets to still-unresolved blocks
    if (ruleSets.length > 0) {
      newPalette = newPalette.map((block) => {
        if (targetReg.blocks.has(block.id)) return block;
        const candidate = applyRules(block, ruleSets, targetReg);
        if (!candidate) return block;
        const targetDef = targetReg.blocks.get(candidate.id);
        if (targetDef) return transformStates(block, targetDef).block;
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

  async export(_schematicId: string, _format: "schem" | "litematic" | "nbt"): Promise<Blob> {
    throw new Error("Not implemented — Phase 4");
  },

  async importRuleSet(_json: string): Promise<RuleSet> {
    throw new Error("Not implemented — Phase 4");
  },

  async exportRuleSet(_resolutions: ResolutionMap, _meta: RuleSetMeta): Promise<string> {
    throw new Error("Not implemented — Phase 4");
  },
};

expose(api);
