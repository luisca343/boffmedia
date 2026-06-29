"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

/** Loads a block's mod texture (data URL) from a worker-held registry, or null. */
type ModTextureLoader = (registryId: string, blockId: string) => Promise<string | null>;

const ModTextureContext = createContext<ModTextureLoader | null>(null);

interface ProviderProps {
  /**
   * Fetches a block's mod texture from the worker. A plain function — never the
   * Comlink `Remote` proxy itself: React 19's dev render logger serializes props
   * and a proxy throws "Cannot convert object to primitive value" on inspection.
   */
  getBlockTexture: ModTextureLoader | null;
  children: ReactNode;
}

/**
 * Provides a memoized loader for mod block textures. Results are cached per
 * `registryId:blockId` so a block rendered in many rows (or across re-renders)
 * only crosses the worker boundary once. Registry ids are unique per scan, so
 * the cache never goes stale within a worker's lifetime.
 */
export function ModTextureProvider({ getBlockTexture, children }: ProviderProps) {
  const cache = useRef(new Map<string, Promise<string | null>>());

  const load = useCallback<ModTextureLoader>(
    (registryId, blockId) => {
      if (!getBlockTexture) return Promise.resolve(null);
      const key = `${registryId}:${blockId}`;
      let pending = cache.current.get(key);
      if (!pending) {
        pending = getBlockTexture(registryId, blockId).catch(() => null);
        cache.current.set(key, pending);
      }
      return pending;
    },
    [getBlockTexture],
  );

  return <ModTextureContext.Provider value={load}>{children}</ModTextureContext.Provider>;
}

export function useModTextureLoader(): ModTextureLoader | null {
  return useContext(ModTextureContext);
}
