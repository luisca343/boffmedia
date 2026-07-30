import { expose } from "comlink";
import { createEngineState, type SchematicEngineState } from "@/lib/schematic/worker/core-ops";
import * as core from "@/lib/schematic/worker/core-ops";
import type { ViewerWorkerAPI } from "./viewer-api";

// Every op here is `core-ops` verbatim: this worker adds no behaviour, it only
// declares which slice of the engine a read-only viewer is allowed to reach.
const state: SchematicEngineState = createEngineState();

const api: ViewerWorkerAPI = {
  ping: () => core.ping(),

  loadVanillaRegistry: (version: string) => core.loadVanillaRegistry(state, version),

  scanInstance: (gameId, files, onProgress, override) =>
    core.scanInstance(state, gameId, files, onProgress, { override }),

  getBlockTexture: (registryId: string, blockId: string, meta?: number) =>
    core.getBlockTexture(state, registryId, blockId, meta),

  getBlockModel: (registryId: string, blockId: string, stateLabel?: string, rotation?: number) =>
    core.getBlockModel(state, registryId, blockId, stateLabel, rotation),

  getModdedBlockModel: (registryId: string, blockId: string, states: Record<string, string>) =>
    core.getModdedBlockModel(state, registryId, blockId, states),

  loadSchematic: (file: File) => core.loadSchematic(state, file),

  loadWorldIds: (file: File) => core.loadWorldIds(state, file),

  clearWorldIds: () => core.clearWorldIds(state),

  getSchematicBlockPositions: (schematicId: string) =>
    core.getSchematicBlockPositions(state, schematicId),

  getLittleTileBoxes: (schematicId: string) => core.getLittleTileBoxes(state, schematicId),

  getLittleTileStructures: (schematicId: string) => core.getLittleTileStructures(state, schematicId),

  release: (id: string) => core.release(state, id),
};

expose(api);
