"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { DocumentSlice, StoreLike, ViewerSlice } from "../state";
import type { PositionsApi } from "./worker-contracts";

type PositionsStore = DocumentSlice & ViewerSlice;

function useStoreValue<S, T>(store: StoreLike<S>, select: (s: S) => T): T {
  const read = () => select(store.getState());
  return useSyncExternalStore(store.subscribe, read, read);
}

/**
 * Keeps the viewer's block instance data in sync with the loaded document. The
 * heavy lifting (iterating blockData, building Float32Arrays) stays in the
 * worker; only the typed arrays cross back.
 *
 * A document is renderable the moment it is parsed — nothing here waits on a
 * conversion. `invalidate` forces a re-fetch when the caller knows the
 * worker-side document changed identity without its id changing: a conversion
 * tool applying resolutions builds a fresh schematic.
 */
export function useSchematicPositions<S extends PositionsStore>(
  store: StoreLike<S>,
  api: PositionsApi | null,
  invalidate?: unknown,
) {
  const schematicId = useStoreValue(store, (s) => s.schematic?.id);

  useEffect(() => {
    const { setBlockPositions, setFetchingPositions } = store.getState();
    if (!api || !schematicId) {
      setBlockPositions([]);
      store.getState().setLittleTileGroups([]);
      setFetchingPositions(false);
      return;
    }
    let cancelled = false;
    setFetchingPositions(true);
    const boxes = api.getLittleTileBoxes?.(schematicId) ?? Promise.resolve([]);
    Promise.all([api.getSchematicBlockPositions(schematicId), boxes])
      .then(([groups, ltGroups]) => {
        if (cancelled) return;
        setBlockPositions(groups);
        store.getState().setLittleTileGroups(ltGroups);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setFetchingPositions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, store, schematicId, invalidate]);
}
