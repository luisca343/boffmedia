"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import type { CompiledModel } from "../_lib/model/types";
import type { BlockDefinition } from "../_lib/types";

/** Loads a block's mod texture (data URL) from a worker-held registry, or null. */
type ModTextureLoader = (registryId: string, blockId: string) => Promise<string | null>;

/** Loads a block's compiled shaped-model geometry from a worker-held registry. */
type ModelLoader = (
  registryId: string,
  blockId: string,
  stateLabel?: string,
  rotation?: number,
) => Promise<CompiledModel | null>;

/** Loads a connected block's shape → variant map, or null when it isn't one. */
type ConnectionsLoader = (
  registryId: string,
  blockId: string,
) => Promise<BlockDefinition["connections"] | null>;

const ModTextureContext = createContext<ModTextureLoader | null>(null);
const ModelContext = createContext<ModelLoader | null>(null);
const ConnectionsContext = createContext<ConnectionsLoader | null>(null);

interface ProviderProps {
  /**
   * Fetches a block's mod texture from the worker. A plain function — never the
   * Comlink `Remote` proxy itself: React 19's dev render logger serializes props
   * and a proxy throws "Cannot convert object to primitive value" on inspection.
   */
  getBlockTexture: ModTextureLoader | null;
  /** Fetches a block's compiled shaped model from the worker (same proxy caveat). */
  getBlockModel: ModelLoader | null;
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
export function ModTextureProvider({ getBlockTexture, getBlockModel, getBlockConnections, children }: ProviderProps) {
  const texCache = useRef(new Map<string, Promise<string | null>>());
  const modelCache = useRef(new Map<string, Promise<CompiledModel | null>>());
  const connCache = useRef(new Map<string, Promise<BlockDefinition["connections"] | null>>());

  const loadTexture = useCallback<ModTextureLoader>(
    (registryId, blockId) => {
      if (!getBlockTexture) return Promise.resolve(null);
      const key = `${registryId}:${blockId}`;
      let pending = texCache.current.get(key);
      if (!pending) {
        pending = getBlockTexture(registryId, blockId).catch(() => null);
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
    <ModTextureContext.Provider value={loadTexture}>
      <ModelContext.Provider value={loadModel}>
        <ConnectionsContext.Provider value={loadConnections}>{children}</ConnectionsContext.Provider>
      </ModelContext.Provider>
    </ModTextureContext.Provider>
  );
}

export function useModTextureLoader(): ModTextureLoader | null {
  return useContext(ModTextureContext);
}

export function useModelLoader(): ModelLoader | null {
  return useContext(ModelContext);
}

export function useConnectionsLoader(): ConnectionsLoader | null {
  return useContext(ConnectionsContext);
}
