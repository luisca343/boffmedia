"use client";

import { useSchematicPositions } from "../../engine/actions";
import type { CompatWorkerAPI } from "../_lib/worker/worker-api";
import { useToolStore } from "../_store/tool.store";

/**
 * Feeds the 3D preview. A loaded schematic is renderable immediately — the
 * fetch does not wait on a conversion. `diff` only invalidates the result:
 * applying resolutions builds a fresh worker-side schematic under a new id.
 */
export function useSchematicRender(api: CompatWorkerAPI | null) {
  const diff = useToolStore((s) => s.diff);
  useSchematicPositions(useToolStore, api, diff);
}
