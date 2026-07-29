import type { GameId } from "@/lib/schematic/adapters/game-adapter";
import type {
  BlockPositionGroup,
  LittleTilesGroup,
  ProgressCb,
  RegistryHandle,
  ScanOverride,
  SchematicSummary,
  WorldIdSummary,
} from "@/lib/schematic/types";
import type { CompiledModel } from "@/lib/schematic/model/types";

/**
 * The read-only half of the schematic engine: everything needed to put a
 * structure on screen, and nothing else. No diff, no resolutions, no export —
 * the converter's ops are not merely unused here, they are absent, so this
 * worker never pulls the conversion pipeline into its bundle.
 *
 * Stateful like the converter's: registries and parsed structures stay inside
 * the worker and the UI holds only handles, so block arrays never cross
 * postMessage.
 */
export interface ViewerWorkerAPI {
  /** Round-trip health check used to confirm the worker booted. */
  ping(): Promise<"pong">;

  /** Load a bundled vanilla registry for a version. */
  loadVanillaRegistry(version: string): Promise<RegistryHandle>;

  /**
   * Build a registry from a real install: vanilla base + every mod JAR's blocks
   * and textures. Viewing a modded build needs this — a mod's textures live in
   * its JAR and nowhere else, so without a scan those blocks are placeholders.
   */
  scanInstance(
    gameId: GameId,
    files: File[],
    onProgress: ProgressCb,
    override?: ScanOverride,
  ): Promise<RegistryHandle>;

  /** A block's texture as a data URL, or `null` for vanilla / unresolved blocks. */
  getBlockTexture(registryId: string, blockId: string, meta?: number): Promise<string | null>;

  /** Baked geometry for a shaped (non-cube) block, or `null` for plain cubes. */
  getBlockModel(
    registryId: string,
    blockId: string,
    stateLabel?: string,
    rotation?: number,
  ): Promise<CompiledModel | null>;

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

  /** Per-block-type instance data for the 3D view. */
  getSchematicBlockPositions(schematicId: string): Promise<BlockPositionGroup[]>;

  /** LittleTiles micro-box groups; empty when the document has none. */
  getLittleTileBoxes(schematicId: string): Promise<LittleTilesGroup[]>;

  /** Free a cached schematic or registry. */
  release(id: string): Promise<void>;
}
