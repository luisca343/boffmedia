import { expose } from "comlink";
import type { GameId } from "@/lib/schematic/adapters/game-adapter";
import type { ProgressCb, RegistryHandle, ScanOverride } from "@/lib/schematic/types";
import { createEngineState, type SchematicEngineState } from "@/lib/schematic/worker/core-ops";
import * as core from "@/lib/schematic/worker/core-ops";
import type { ViewerWorkerAPI } from "./viewer-api";

// Every op here is `core-ops` verbatim: this worker adds no behaviour, it only
// declares which eighth of the engine a read-only viewer is allowed to reach.
const state: SchematicEngineState = createEngineState();

const api: ViewerWorkerAPI = {
  ping: () => core.ping(),

  scanInstance: (
    gameId: GameId,
    files: File[],
    onProgress: ProgressCb,
    override?: ScanOverride,
  ): Promise<RegistryHandle> => core.scanInstance(state, gameId, files, onProgress, { override }),

  loadVanillaRegistry: (version: string) => core.loadVanillaRegistry(state, version),

  getBlockTexture: (registryId: string, blockId: string) =>
    core.getBlockTexture(state, registryId, blockId),

  getBlockModel: (registryId: string, blockId: string, stateLabel?: string, rotation?: number) =>
    core.getBlockModel(state, registryId, blockId, stateLabel, rotation),

  loadSchematic: (file: File) => core.loadSchematic(state, file),

  getSchematicBlockPositions: (schematicId: string) =>
    core.getSchematicBlockPositions(state, schematicId),

  release: (id: string) => core.release(state, id),
};

expose(api);
