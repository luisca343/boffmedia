import type {
  CompatDiff,
  ResolutionMap,
  RuleSet,
  RuleSetMeta,
  DiffEntry,
  RegistryHandle,
  SchematicSummary,
  BlockPositionGroup,
  ProgressCb,
} from "../types";

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
    metaFiles: File[],
    jarFiles: File[],
    onProgress: ProgressCb
  ): Promise<RegistryHandle>;

  /** Full list of block ids in a loaded registry (for replacement comboboxes). */
  getRegistryBlockIds(registryId: string): Promise<string[]>;

  /**
   * Representative texture for a block as a `data:image/png;base64,…` URL,
   * extracted from the instance's mod JARs at scan time. Returns `null` for
   * vanilla blocks (the UI sources those from the texture mirror) or when no
   * texture was resolved. Fetched lazily, one block at a time, so the texture
   * Map never crosses the boundary in bulk.
   */
  getBlockTexture(registryId: string, blockId: string): Promise<string | null>;

  /** Parse a schematic file; caches it in the worker and returns a summary. */
  loadSchematic(file: File): Promise<SchematicSummary>;

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

  export(schematicId: string, format: "schem" | "litematic" | "nbt"): Promise<Blob>;

  importRuleSet(json: string): Promise<RuleSet>;
  exportRuleSet(resolutions: ResolutionMap, meta: RuleSetMeta): Promise<string>;
}
