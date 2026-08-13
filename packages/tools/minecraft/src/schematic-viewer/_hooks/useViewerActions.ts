"use client";

import { useCallback, useEffect } from "react";
import type { Remote } from "comlink";
import {
  useDocumentActions,
  useEnvironmentActions,
  useSchematicPositions,
} from "../../engine/actions";
import type { EnvMode } from "../../engine/state";
import type { ViewerWorkerAPI } from "../_lib/viewer-api";
import { useViewerStore } from "../_store/viewer.store";

/**
 * The whole tool's behaviour, and all of it is shared: load a document, build
 * the environment from a bundled version, keep the 3D instance data in sync.
 * Nothing is orchestrated across subsystems because there is no conversion state
 * a new document could invalidate.
 */
export function useViewerActions(api: Remote<ViewerWorkerAPI> | null, engineReady: boolean) {
  const { loadSchematic, attachWorldIds, clearWorldIds } = useDocumentActions(useViewerStore, api);
  const { loadVanillaEnv, scanInstance } = useEnvironmentActions(useViewerStore, api);
  useSchematicPositions(useViewerStore, api);

  const version = useViewerStore((s) => s.envs.source.vanillaVersion);
  const envMode = useViewerStore((s) => s.envs.source.envMode);
  const setVanillaVersion = useViewerStore((s) => s.setVanillaVersion);
  const setEnvMode = useViewerStore((s) => s.setEnvMode);

  // In vanilla mode picking a version IS the environment choice — there is no
  // folder to select and no confirm step, so build the registry as soon as it
  // changes. A scanned instance is driven by the folder pick instead.
  useEffect(() => {
    if (engineReady && envMode === "vanilla") void loadVanillaEnv("source", version);
  }, [engineReady, envMode, version, loadVanillaEnv]);

  const changeVersion = useCallback(
    (v: string) => setVanillaVersion("source", v),
    [setVanillaVersion],
  );

  const changeMode = useCallback((m: EnvMode) => setEnvMode("source", m), [setEnvMode]);

  const scanEnvironment = useCallback(
    (files: File[]) => void scanInstance("source", "minecraft", files),
    [scanInstance],
  );

  return {
    loadSchematic,
    attachWorldIds,
    clearWorldIds,
    changeVersion,
    changeMode,
    scanEnvironment,
  };
}
