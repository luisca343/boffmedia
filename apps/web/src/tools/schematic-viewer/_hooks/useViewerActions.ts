"use client";

import { useCallback, useEffect } from "react";
import type { Remote } from "comlink";
import {
  useDocumentActions,
  useEnvironmentActions,
  useSchematicPositions,
} from "@/lib/schematic/actions";
import type { ViewerWorkerAPI } from "../_lib/viewer-api";
import { useViewerStore } from "../_store/viewer.store";

/**
 * The whole tool's behaviour, and all of it is shared: load a document, build
 * the environment from a bundled version, keep the 3D instance data in sync.
 * Nothing is orchestrated across subsystems because there is no conversion state
 * a new document could invalidate.
 */
export function useViewerActions(api: Remote<ViewerWorkerAPI> | null, engineReady: boolean) {
  const { loadSchematic } = useDocumentActions(useViewerStore, api);
  const { loadVanillaEnv } = useEnvironmentActions(useViewerStore, api);
  useSchematicPositions(useViewerStore, api);

  const version = useViewerStore((s) => s.envs.source.vanillaVersion);
  const setVanillaVersion = useViewerStore((s) => s.setVanillaVersion);

  // Picking a version IS the environment choice — there is no folder to select
  // and no confirm step, so build the registry as soon as it changes.
  useEffect(() => {
    if (engineReady) void loadVanillaEnv("source", version);
  }, [engineReady, version, loadVanillaEnv]);

  const changeVersion = useCallback(
    (v: string) => setVanillaVersion("source", v),
    [setVanillaVersion],
  );

  return { loadSchematic, changeVersion };
}
