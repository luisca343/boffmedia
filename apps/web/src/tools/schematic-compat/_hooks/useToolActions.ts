"use client";

import { useCallback } from "react";
import { proxy, type Remote } from "comlink";
import type { CompatWorkerAPI } from "../_lib/worker/worker-api";
import { useToolStore } from "../_store/tool.store";

// The EnvPicker gathers only the relevant files (launcher metadata + mods/*.jar)
// from the picked instance folder, so `saves/`, configs, etc. never reach here.

/**
 * Orchestration layer between the React UI and the Comlink worker.
 * All worker calls funnel through here so the store stays declarative and the
 * components stay free of engine plumbing.
 */
export function useToolActions(api: Remote<CompatWorkerAPI> | null) {
  const store = useToolStore;

  const scanSourceInstance = useCallback(
    async (metaFiles: File[], jarFiles: File[]) => {
      if (!api) return;
      const s = store.getState();
      s.setError(undefined);
      s.setLoadingSource(true);
      s.setSourceScan({ pct: 0, msg: "" });
      try {
        const onProgress = proxy((pct: number, msg: string) =>
          store.getState().setSourceScan({ pct, msg })
        );
        const handle = await api.scanInstance(metaFiles, jarFiles, onProgress);
        store.getState().setSourceReg(handle);
        store.getState().setDiff(undefined);
      } catch (err) {
        store.getState().setError(errMsg(err));
        store.getState().setSourceReg(undefined);
      } finally {
        store.getState().setLoadingSource(false);
        store.getState().setSourceScan(undefined);
      }
    },
    [api, store]
  );

  const scanTargetInstance = useCallback(
    async (metaFiles: File[], jarFiles: File[]) => {
      if (!api) return;
      const s = store.getState();
      s.setError(undefined);
      s.setLoadingTarget(true);
      s.setTargetScan({ pct: 0, msg: "" });
      try {
        const onProgress = proxy((pct: number, msg: string) =>
          store.getState().setTargetScan({ pct, msg })
        );
        const handle = await api.scanInstance(metaFiles, jarFiles, onProgress);
        store.getState().setTargetReg(handle);
        const ids = await api.getRegistryBlockIds(handle.id);
        store.getState().setTargetBlockIds(ids);
        store.getState().setDiff(undefined);
      } catch (err) {
        store.getState().setError(errMsg(err));
        store.getState().setTargetReg(undefined);
        store.getState().setTargetBlockIds([]);
      } finally {
        store.getState().setLoadingTarget(false);
        store.getState().setTargetScan(undefined);
      }
    },
    [api, store]
  );

  const loadSchematic = useCallback(
    async (file: File) => {
      if (!api) return;
      const s = store.getState();
      s.setError(undefined);
      s.setLoadingSchematic(true);
      try {
        const summary = await api.loadSchematic(file);
        store.getState().setSchematic(summary);
      } catch (err) {
        store.getState().setError(errMsg(err));
        store.getState().setSchematic(undefined);
      } finally {
        store.getState().setLoadingSchematic(false);
      }
    },
    [api, store]
  );

  const analyze = useCallback(async () => {
    if (!api) return;
    const { schematic, sourceReg, targetReg } = store.getState();
    if (!schematic || !sourceReg || !targetReg) return;
    store.getState().setError(undefined);
    store.getState().setAnalyzing(true);
    try {
      const diff = await api.computeDiff(schematic.id, sourceReg.id, targetReg.id);
      store.getState().setDiff(diff);
    } catch (err) {
      store.getState().setError(errMsg(err));
      store.getState().setDiff(undefined);
    } finally {
      store.getState().setAnalyzing(false);
    }
  }, [api, store]);

  return { scanSourceInstance, scanTargetInstance, loadSchematic, analyze };
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}
