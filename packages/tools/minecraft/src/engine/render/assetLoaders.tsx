"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import type { CompiledModel } from "../model/types";
import type { BlockDefinition } from "../types";

/** Loads a block's mod texture (data URL) from a worker-held registry, or null. */
export type TextureLoader = (
  registryId: string,
  blockId: string,
  /** Pre-flattening metadata: selects the block's variant texture. */
  meta?: number,
) => Promise<string | null>;

/** Loads a block's compiled shaped-model geometry from a worker-held registry. */
export type ModelLoader = (
  registryId: string,
  blockId: string,
  stateLabel?: string,
  rotation?: number,
) => Promise<CompiledModel | null>;

/**
 * Loads a modded Minecraft block's compiled geometry for one blockstate, read
 * from the worker's mod JARs. Separate from {@link ModelLoader} because the
 * modded chain is keyed by the full state map, not a single state label.
 */
export type ModdedModelLoader = (
  registryId: string,
  blockId: string,
  states: Record<string, string>,
) => Promise<CompiledModel | null>;

/** Loads a connected block's shape → variant map, or null when it isn't one. */
export type ConnectionsLoader = (
  registryId: string,
  blockId: string,
) => Promise<BlockDefinition["connections"] | null>;

const TextureContext = createContext<TextureLoader | null>(null);
const ModelContext = createContext<ModelLoader | null>(null);
const ModdedModelContext = createContext<ModdedModelLoader | null>(null);
const ConnectionsContext = createContext<ConnectionsLoader | null>(null);

interface ProviderProps {
  /**
   * Fetches a block's mod texture from the worker. A plain function — never the
   * Comlink `Remote` proxy itself: React 19's dev render logger serializes props
   * and a proxy throws "Cannot convert object to primitive value" on inspection.
   */
  getBlockTexture: TextureLoader | null;
  /** Fetches a block's compiled shaped model from the worker (same proxy caveat). */
  getBlockModel: ModelLoader | null;
  /**
   * Fetches a modded Minecraft block's compiled model from the worker (same proxy
   * caveat). Optional: a tool that never shows a scanned instance omits it.
   */
  getModdedBlockModel?: ModdedModelLoader | null;
  /** Fetches a block's connection-shape map from the worker (same proxy caveat). */
  getBlockConnections: ConnectionsLoader | null;
  children: ReactNode;
}

/**
 * Provides memoized loaders for mod block textures and shaped-block geometry.
 * Results are cached per `registryId:blockId(:state)` so a block rendered in many
 * rows / re-renders crosses the worker boundary once. Registry ids are unique per
 * scan, so the cache never goes stale within a worker's lifetime.
 */
export function SchematicAssetProvider({ getBlockTexture, getBlockModel, getModdedBlockModel, getBlockConnections, children }: ProviderProps) {
  const texCache = useRef(new Map<string, Promise<string | null>>());
  const modelCache = useRef(new Map<string, Promise<CompiledModel | null>>());
  const moddedCache = useRef(new Map<string, Promise<CompiledModel | null>>());
  const connCache = useRef(new Map<string, Promise<BlockDefinition["connections"] | null>>());

  const loadTexture = useCallback<TextureLoader>(
    (registryId, blockId, meta) => {
      if (!getBlockTexture) return Promise.resolve(null);
      // The metadata is part of the identity: two metas of one block id are two
      // different textures.
      const key = `${registryId}:${blockId}:${meta ?? 0}`;
      let pending = texCache.current.get(key);
      if (!pending) {
        pending = getBlockTexture(registryId, blockId, meta).catch(() => null);
        texCache.current.set(key, pending);
      }
      return pending;
    },
    [getBlockTexture],
  );

  const loadModel = useCallback<ModelLoader>(
    (registryId, blockId, stateLabel, rotation) => {
      if (!getBlockModel) return Promise.resolve(null);
      const key = `${registryId}:${blockId}:${stateLabel ?? ""}:${rotation ?? 0}`;
      let pending = modelCache.current.get(key);
      if (!pending) {
        pending = getBlockModel(registryId, blockId, stateLabel, rotation).catch(() => null);
        modelCache.current.set(key, pending);
      }
      return pending;
    },
    [getBlockModel],
  );

  const loadModdedModel = useCallback<ModdedModelLoader>(
    (registryId, blockId, states) => {
      if (!getModdedBlockModel) return Promise.resolve(null);
      // The state map is part of the identity: a stair's `facing`/`half` pick
      // different geometry from the same block id.
      const stateKey = Object.keys(states)
        .sort()
        .map((k) => `${k}=${states[k]}`)
        .join(",");
      const key = `${registryId}:${blockId}:${stateKey}`;
      let pending = moddedCache.current.get(key);
      if (!pending) {
        pending = getModdedBlockModel(registryId, blockId, states).catch(() => null);
        moddedCache.current.set(key, pending);
      }
      return pending;
    },
    [getModdedBlockModel],
  );

  const loadConnections = useCallback<ConnectionsLoader>(
    (registryId, blockId) => {
      if (!getBlockConnections) return Promise.resolve(null);
      const key = `${registryId}:${blockId}`;
      let pending = connCache.current.get(key);
      if (!pending) {
        pending = getBlockConnections(registryId, blockId).catch(() => null);
        connCache.current.set(key, pending);
      }
      return pending;
    },
    [getBlockConnections],
  );

  return (
    <TextureContext.Provider value={loadTexture}>
      <ModelContext.Provider value={loadModel}>
        <ModdedModelContext.Provider value={loadModdedModel}>
          <ConnectionsContext.Provider value={loadConnections}>{children}</ConnectionsContext.Provider>
        </ModdedModelContext.Provider>
      </ModelContext.Provider>
    </TextureContext.Provider>
  );
}

export function useTextureLoader(): TextureLoader | null {
  return useContext(TextureContext);
}

export function useModelLoader(): ModelLoader | null {
  return useContext(ModelContext);
}

export function useModdedModelLoader(): ModdedModelLoader | null {
  return useContext(ModdedModelContext);
}

export function useConnectionsLoader(): ConnectionsLoader | null {
  return useContext(ConnectionsContext);
}
