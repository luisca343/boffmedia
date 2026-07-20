import type { GameId } from "../adapters/game-adapter";
import type {
  BlockPositionGroup,
  ProgressCb,
  RegistryHandle,
  ScanOverride,
  SchematicSummary,
} from "../types";

/**
 * The slices of a worker API the shared action hooks depend on. Declared here
 * (rather than importing a tool's full worker interface) so a tool only has to
 * expose these methods to reuse the hooks. A Comlink `Remote<T>` of a worker
 * that implements them satisfies these structurally.
 */

export interface ReleasableApi {
  /** Free a worker-held artifact (registry / schematic). */
  release(id: string): Promise<void>;
}

export interface DocumentApi extends ReleasableApi {
  loadSchematic(file: File): Promise<SchematicSummary>;
}

export interface EnvironmentApi extends ReleasableApi {
  scanInstance(
    gameId: GameId,
    files: File[],
    onProgress: ProgressCb,
    override?: ScanOverride,
  ): Promise<RegistryHandle>;
  loadVanillaRegistry(version: string): Promise<RegistryHandle>;
}

export interface PositionsApi {
  getSchematicBlockPositions(schematicId: string): Promise<BlockPositionGroup[]>;
}
