import type { GameId } from "../adapters/game-adapter";
import type {
  BlockPositionGroup,
  LittleTilesGroup,
  LittleTilesStructure,
  ProgressCb,
  RegistryHandle,
  ScanOverride,
  SchematicSummary,
  WorldIdSummary,
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
  /**
   * Optional: attach the pre-1.13 world whose `level.dat` names the numeric
   * block ids in legacy files. A tool that never opens legacy inputs omits it.
   */
  loadWorldIds?(file: File): Promise<WorldIdSummary>;
  clearWorldIds?(): Promise<void>;
}

export interface EnvironmentApi extends ReleasableApi {
  /**
   * Optional: a vanilla-only tool (the viewer) never scans a real install, so
   * its worker omits this method and the hook's scan path becomes a no-op.
   */
  scanInstance?(
    gameId: GameId,
    files: File[],
    onProgress: ProgressCb,
    override?: ScanOverride,
  ): Promise<RegistryHandle>;
  loadVanillaRegistry(version: string): Promise<RegistryHandle>;
}

export interface PositionsApi {
  getSchematicBlockPositions(schematicId: string): Promise<BlockPositionGroup[]>;
  /**
   * Optional: LittleTiles micro-box groups for the same document. Workers that
   * predate LT support simply omit it and the viewer renders no micro-boxes.
   */
  getLittleTileBoxes?(schematicId: string): Promise<LittleTilesGroup[]>;
  /**
   * Optional: LittleTiles structure instances (doors, chairs…) of the same
   * document; empty when it has none.
   */
  getLittleTileStructures?(schematicId: string): Promise<LittleTilesStructure[]>;
}
