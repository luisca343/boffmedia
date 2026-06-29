"use client";

import { useEffect } from "react";
import { useToolStore } from "../_store/tool.store";
import type { CompatWorkerAPI } from "../_lib/worker/worker-api";

/**
 * Fetches block position data from the worker after analysis completes and
 * stores it in the tool store for the 3D preview to consume.
 *
 * Re-runs whenever the schematic id or diff changes (i.e. after each Analyze
 * click).  The heavy lifting (iterating blockData, building Float32Arrays)
 * stays in the worker.
 */
export function useSchematicRender(api: CompatWorkerAPI | null) {
  const schematicId = useToolStore((s) => s.schematic?.id);
  const diff = useToolStore((s) => s.diff);
  const setBlockPositions = useToolStore((s) => s.setBlockPositions);
  const setFetchingPositions = useToolStore((s) => s.setFetchingPositions);

  useEffect(() => {
    if (!api || !schematicId || !diff) {
      setBlockPositions([]);
      return;
    }
    setFetchingPositions(true);
    api
      .getSchematicBlockPositions(schematicId)
      .then(setBlockPositions)
      .catch(console.error)
      .finally(() => setFetchingPositions(false));
    // diff is in deps so we re-fetch if applyResolutions creates a new schematic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, schematicId, diff]);
}
