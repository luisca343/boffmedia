"use client";

import { useCallback } from "react";
import type { Remote } from "comlink";
import { useDocumentActions, useEnvironmentActions } from "@/lib/schematic/actions";
import type { GameId } from "@/lib/schematic/adapters/game-adapter";
import type { CompatWorkerAPI } from "../_lib/worker/worker-api";
import { useToolStore } from "../_store/tool.store";
import { useConversionActions } from "./useConversionActions";

/**
 * The tool's whole action surface, composed from the reusable document and
 * environment orchestration in `lib/schematic/actions` plus this tool's
 * conversion actions.
 *
 * The conversion hook supplies the callbacks that keep diff/resolution state
 * consistent when a document or a registry is replaced. Those cascades happen
 * here, in the open, instead of hidden inside a store setter.
 */
export function useToolActions(api: Remote<CompatWorkerAPI> | null) {
  const {
    analyze,
    exportSchematic,
    exportRuleSet,
    importRuleSet,
    onDocumentChanged,
    onRegistryApplied,
    onRegistryCleared,
    onGameChanged,
  } = useConversionActions(api);

  const { loadSchematic } = useDocumentActions(useToolStore, api, { onDocumentChanged });

  const { scanInstance, changeGame, retryPendingScan, cancelPendingScan, loadVanillaEnv } =
    useEnvironmentActions(useToolStore, api, {
      onRegistryApplied,
      onRegistryCleared,
      onGameChanged,
    });

  const scanSourceInstance = useCallback(
    (gameId: GameId, files: File[]) => scanInstance("source", gameId, files),
    [scanInstance],
  );
  const scanTargetInstance = useCallback(
    (gameId: GameId, files: File[]) => scanInstance("target", gameId, files),
    [scanInstance],
  );
  const changeSourceGame = useCallback((gameId: GameId) => changeGame("source", gameId), [changeGame]);
  const changeTargetGame = useCallback((gameId: GameId) => changeGame("target", gameId), [changeGame]);

  return {
    scanSourceInstance,
    scanTargetInstance,
    retryPendingScan,
    cancelPendingScan,
    loadVanillaEnv,
    changeSourceGame,
    changeTargetGame,
    loadSchematic,
    analyze,
    exportSchematic,
    exportRuleSet,
    importRuleSet,
  };
}
