import type {
  BlockPositionGroup,
  RegistryHandle,
  SchematicSummary,
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

  /**
   * Load a bundled vanilla registry for a version — the viewer's only
   * environment. Instance scanning is deliberately absent: `EnvironmentApi`
   * makes it optional, so a read-only viewer never carries a scan it can't run.
   */
  loadVanillaRegistry(version: string): Promise<RegistryHandle>;

  /** A block's texture as a data URL, or `null` for vanilla / unresolved blocks. */
  getBlockTexture(registryId: string, blockId: string): Promise<string | null>;

  /** Baked geometry for a shaped (non-cube) block, or `null` for plain cubes. */
  getBlockModel(
    registryId: string,
    blockId: string,
    stateLabel?: string,
    rotation?: number,
  ): Promise<CompiledModel | null>;

  /** Parse a schematic file; caches it in the worker and returns a summary. */
  loadSchematic(file: File): Promise<SchematicSummary>;

  /** Per-block-type instance data for the 3D view. */
  getSchematicBlockPositions(schematicId: string): Promise<BlockPositionGroup[]>;

  /** Free a cached schematic or registry. */
  release(id: string): Promise<void>;
}
