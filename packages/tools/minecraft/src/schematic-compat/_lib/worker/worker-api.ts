import type {
  CompatDiff,
  ResolutionMap,
  RuleSet,
  RuleSetMeta,
  DiffEntry,
  RegistryHandle,
  SchematicSummary,
  WorldIdSummary,
  LittleTilesGroup,
  LittleTilesStructure,
  BlockPositionGroup,
  BlockDefinition,
  ProgressCb,
  ScanOverride,
  ExportFormat,
} from "../../../engine/types";
import type { GameId } from "../../../engine/adapters/game-adapter";
import type { CompiledModel } from "../../../engine/model/types";

/**
 * Comlink-exposed worker API.
 *
 * The worker is STATEFUL: loaded schematics and registries live inside the
 * worker and are referenced from the UI by id (see {@link SchematicSummary} and
 * {@link RegistryHandle}). This keeps large block arrays and registry maps off
 * the postMessage boundary — only lightweight handles and the diff result cross
 * back to the UI thread.
 */
export interface CompatWorkerAPI {
  /** Round-trip health check used to confirm the worker booted. */
  ping(): Promise<"pong">;

  /**
   * Build a block registry from a real Minecraft instance folder: detect its
   * version + loader from launcher metadata, take the matching bundled vanilla
   * registry as the base, then merge every mod JAR's blocks. Caches the result
   * in the worker and returns a handle.
   *
   * `metaFiles` are the instance metadata files (minecraftinstance.json /
   * manifest.json); `jarFiles` are the `mods/*.jar` files — both pre-filtered on
   * the UI thread. `onProgress` is a Comlink-proxied callback.
   */
  scanInstance(
    gameId: GameId,
    files: File[],
    onProgress: ProgressCb,
    override?: ScanOverride,
  ): Promise<RegistryHandle>;

  /**
   * Build an environment from a bundled vanilla registry — no instance folder.
   * Rejects the `E_INSTANCE_UNDETECTED` dead end for the common "I just want to
   * convert between two vanilla versions" case, and gives cross-game conversions
   * a target that needs no Minecraft install at all.
   */
  loadVanillaRegistry(version: string): Promise<RegistryHandle>;

  /** Full list of block ids in a loaded registry (for replacement comboboxes). */
  getRegistryBlockIds(registryId: string): Promise<string[]>;

  /**
   * Representative texture for a block as a `data:image/png;base64,…` URL,
   * extracted from the instance's mod JARs at scan time. Returns `null` for
   * vanilla blocks (the UI sources those from the texture mirror) or when no
   * texture was resolved. Fetched lazily, one block at a time, so the texture
   * Map never crosses the boundary in bulk.
   */
  getBlockTexture(registryId: string, blockId: string, meta?: number): Promise<string | null>;

  /**
   * Baked geometry for a block's shaped (non-cube) model, or `null` when the
   * block is a plain cube / has no model. Compiled on demand in the worker (e.g.
   * Hytale reads the block's `.blockymodel` + texture from Assets.zip) and
   * returned as plain typed arrays. `stateLabel` selects a state-variant model;
   * `rotation` is the prefab placement index (0–11) baked into the geometry.
   */
  getBlockModel(
    registryId: string,
    blockId: string,
    stateLabel?: string,
    rotation?: number
  ): Promise<CompiledModel | null>;

  /**
   * Baked geometry for a modded Minecraft block in a given blockstate, resolved
   * on demand from the instance's mod JARs (blockstate → model → textures, with
   * texture refs already rewritten into loadable srcs). `null` for vanilla ids —
   * the UI resolves those from the CDN mirror — and when nothing resolves.
   */
  getModdedBlockModel(
    registryId: string,
    blockId: string,
    states: Record<string, string>
  ): Promise<CompiledModel | null>;

  /**
   * A connected block's shape → variant map (`connections`), or `null` when the
   * block isn't a connected block (fence/bars/wall). The 3D preview uses it to
   * resolve a converted block's corner/T/cross variant without pulling every
   * target block definition across the postMessage boundary.
   */
  getBlockConnections(
    registryId: string,
    blockId: string
  ): Promise<BlockDefinition["connections"] | null>;

  /** Parse a schematic file; caches it in the worker and returns a summary. */
  loadSchematic(file: File): Promise<SchematicSummary>;

  /**
   * Attach the `level.dat` of the pre-1.13 world a legacy file was cut from —
   * the only place a modded numeric block id maps to a name. Applies to loads
   * made after this call.
   */
  loadWorldIds(file: File): Promise<WorldIdSummary>;

  /** Detach the world id table. */
  clearWorldIds(): Promise<void>;

  /** LittleTiles micro-box groups; empty when the document has none. */
  getLittleTileBoxes(schematicId: string): Promise<LittleTilesGroup[]>;

  /** LittleTiles structure instances (doors, chairs…); empty when the document has none. */
  getLittleTileStructures(schematicId: string): Promise<LittleTilesStructure[]>;

  /** Diff a cached schematic against cached source/target registries. */
  computeDiff(
    schematicId: string,
    sourceRegId: string,
    targetRegId: string
  ): Promise<CompatDiff>;

  /**
   * Build per-block-type position data for the 3D preview.  Returns one group
   * per non-air palette entry that has at least one instance.  Air blocks
   * (any id ending in `:air` or equal to `"air"`) are excluded.
   */
  getSchematicBlockPositions(schematicId: string): Promise<BlockPositionGroup[]>;

  /** Free a cached schematic or registry. */
  release(id: string): Promise<void>;

  // ── Later phases (stubs throw until implemented) ──────────────────────────
  applyResolutions(
    schematicId: string,
    resolutions: ResolutionMap,
    ruleSets: RuleSet[],
    targetRegId: string
  ): Promise<{ schematicId: string; remaining: DiffEntry[] }>;

  /**
   * Serialise a cached schematic. `dataVersion` is the target environment's
   * save-format version, stamped onto the written file so it declares the format
   * it was converted *to* rather than the source file's (see
   * {@link RegistryHandle.dataVersion}). Omitted for games without the concept.
   */
  export(schematicId: string, format: ExportFormat, dataVersion?: number): Promise<Blob>;

  importRuleSet(json: string): Promise<RuleSet>;
  exportRuleSet(resolutions: ResolutionMap, meta: RuleSetMeta): Promise<string>;
}
