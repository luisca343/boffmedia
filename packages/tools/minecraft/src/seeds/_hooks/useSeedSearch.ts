/**
 * useSeedSearch — one search at a time, torn down with the component.
 *
 * The hook owns the lifecycle so nothing else has to think about it: starting a
 * second search stops the first, unmounting stops whatever is running, and the
 * grown workers go back in every one of those paths. A search that outlived its
 * panel would keep eighteen isolates busy on a spec nobody can see any more.
 *
 * Hits are held here rather than inside the controller so React owns the array
 * it renders, and so stopping a search keeps what it found — the results are
 * the point, and throwing them away on stop would make the stop button
 * something users are afraid of.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { SeedsPool } from "../_lib/pool";
import type { SpecEvalResult } from "../_lib/worker/seeds-api";
import { IDLE_PROGRESS, SeedSearch, type SearchProgress } from "../_lib/search";
import { specStorage } from "../_lib/localWorld";
import type { UiSpec } from "../_spec/model";

export interface SeedSearchState {
  progress: SearchProgress;
  hits: SpecEvalResult[];
  dropped: number;
  start: (
    total: number,
    opts?: { survivorRate?: number; workerTarget?: number; perSeedMs?: number | null },
  ) => void;
  stop: () => void;
  clear: () => void;
}

export function useSeedSearch(pool: SeedsPool | null, coreSpec: unknown): SeedSearchState {
  const [progress, setProgress] = useState<SearchProgress>(IDLE_PROGRESS);
  const [hits, setHits] = useState<SpecEvalResult[]>([]);

  const active = useRef<SeedSearch | null>(null);

  // Read through refs: `start` must not be re-created every time the spec
  // changes, or the button it is bound to would remount mid-search.
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const specRef = useRef(coreSpec);
  specRef.current = coreSpec;

  useEffect(
    () => () => {
      active.current?.stop();
      active.current = null;
    },
    [],
  );

  const start = useCallback((
    total: number,
    opts?: { survivorRate?: number; workerTarget?: number; perSeedMs?: number | null },
  ) => {
    const p = poolRef.current;
    if (!p) return;

    active.current?.stop();
    setHits([]);

    // The spec is frozen at the moment the search starts. Reading it live would
    // mean seeds checked before an edit and seeds checked after it were judged
    // by different specs, and the ranked list would silently mix the two.
    const search = new SeedSearch({
      pool: p,
      spec: JSON.parse(JSON.stringify(specRef.current)) as unknown,
      total,
      survivorRate: opts?.survivorRate,
      perSeedMs: opts?.perSeedMs ?? null,
      workerTarget: opts?.workerTarget,
      onProgress: setProgress,
      onHits: setHits,
    });
    active.current = search;
    void search.run();
  }, []);

  const stop = useCallback(() => {
    active.current?.stop();
  }, []);

  const clear = useCallback(() => {
    active.current?.stop();
    active.current = null;
    setHits([]);
    setProgress(IDLE_PROGRESS);
  }, []);

  return { progress, hits, dropped: progress.dropped, start, stop, clear };
}

/**
 * useNamedSpecs — manage spec persistence using localStorage.
 *
 * Returns CRUD operations for saving/loading/listing specs. All operations are
 * safe in SSR: they check typeof window and do nothing if localStorage is unavailable.
 */
export function useNamedSpecs() {
  const save = useCallback((name: string, spec: UiSpec) => {
    specStorage.saveSpec(name, spec);
  }, []);

  const load = useCallback((name: string): UiSpec | null => {
    const data = specStorage.loadSpec(name);
    if (data && typeof data === "object" && "origin" in data && "scan" in data && "locations" in data) {
      return data as UiSpec;
    }
    return null;
  }, []);

  const list = useCallback(() => {
    return specStorage.listSpecs();
  }, []);

  const remove = useCallback((name: string) => {
    specStorage.deleteSpec(name);
  }, []);

  return { save, load, list, remove };
}
