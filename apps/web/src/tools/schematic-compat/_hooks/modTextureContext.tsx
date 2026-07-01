"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import type { CompiledModel } from "../_lib/model/types";

/** Loads a block's mod texture (data URL) from a worker-held registry, or null. */
type ModTextureLoader = (registryId: string, blockId: string) => Promise<string | null>;

/** Loads a block's compiled shaped-model geometry from a worker-held registry. */
type ModelLoader = (
  registryId: string,
  blockId: string,
  stateLabel?: string,
  rotation?: number,
) => Promise<CompiledModel | null>;

const ModTextureContext = createContext<ModTextureLoader | null>(null);
const ModelContext = createContext<ModelLoader | null>(null);

interface ProviderProps {
  /**
   * Fetches a block's mod texture from the worker. A plain function — never the
   * Comlink `Remote` proxy itself: React 19's dev render logger serializes props
   * and a proxy throws "Cannot convert object to primitive value" on inspection.
   */
  getBlockTexture: ModTextureLoader | null;
  /** Fetches a block's compiled shaped model from the worker (same proxy caveat). */
  getBlockModel: ModelLoader | null;
  children: ReactNode;
}

/**
 * Provides memoized loaders for mod block textures and shaped-block geometry.
 * Results are cached per `registryId:blockId(:state)` so a block rendered in many
 * rows / re-renders crosses the worker boundary once. Registry ids are unique per
 * scan, so the cache never goes stale within a worker's lifetime.
 */
export function ModTextureProvider({ getBlockTexture, getBlockModel, children }: ProviderProps) {
  const texCache = useRef(new Map<string, Promise<string | null>>());
  const modelCache = useRef(new Map<string, Promise<CompiledModel | null>>());

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

  return (
    <ModTextureContext.Provider value={loadTexture}>
      <ModelContext.Provider value={loadModel}>{children}</ModelContext.Provider>
    </ModTextureContext.Provider>
  );
}

export function useModTextureLoader(): ModTextureLoader | null {
  return useContext(ModTextureContext);
}

export function useModelLoader(): ModelLoader | null {
  return useContext(ModelContext);
}
