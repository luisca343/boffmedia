"use client";

import { useCallback } from "react";
import { proxy, type Remote } from "comlink";
import type { CompatWorkerAPI } from "../_lib/worker/worker-api";
import { useToolStore } from "../_store/tool.store";
import type { GameId } from "../_lib/adapters";
import type { ResolutionMap, RuleSetMeta, CompatDiff } from "../_lib/types";
import { parseBlockState } from "../_lib/pipeline/normalizer";
import { exactRulePairs } from "../_lib/pipeline/rules/ruleset";
import type { ExportFormat } from "../_lib/pipeline/exporter";

/** Build the worker-side {@link ResolutionMap} from the store's lightweight choices. */
function toResolutionMap(resolutions: Record<string, { targetId: string }>): ResolutionMap {
  const map: ResolutionMap = {};
  for (const [sourceId, choice] of Object.entries(resolutions)) {
    if (!choice.targetId) continue;
    map[sourceId] = { target: parseBlockState(choice.targetId), applyToAll: true };
  }
  return map;
}

/**
 * The resolution map used for an actual export. Folds in the diff's automatic
 * conversions so they take effect on the written file — renamed blocks map to
 * their detected candidate, and state-changed blocks re-map onto themselves so
 * the state transformer drops their invalid states. Explicit user choices (the
 * per-row replacement comboboxes) are layered on top and win, which is how the
 * "select a different block, in case the automatic one is wrong" override works.
 */
function buildExportResolutionMap(
  diff: CompatDiff | undefined,
  resolutions: Record<string, { targetId: string }>,
): ResolutionMap {
  const map: ResolutionMap = {};
  for (const e of diff?.entries ?? []) {
    if (e.status === "renamed" && e.autoCandidate) {
      map[e.block.id] = { target: e.autoCandidate, applyToAll: true };
    } else if (e.status === "state-changed") {
      // Same id, no stateMap → transformStates substitutes target defaults for
      // the invalid state values.
      map[e.block.id] = { target: e.block, applyToAll: true };
    }
  }
  // Explicit per-row overrides take precedence over the automatic mapping.
  for (const [sourceId, choice] of Object.entries(resolutions)) {
    if (!choice.targetId) continue;
    map[sourceId] = { target: parseBlockState(choice.targetId), applyToAll: true };
  }
  return map;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the navigation has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const EXT: Record<ExportFormat, string> = {
  schem: "schem",
  schem3: "schem",
  litematic: "litematic",
  nbt: "nbt",
  prefab: "prefab.json",
};

function convertedFilename(original: string, format: ExportFormat): string {
  // Strip a trailing extension (and the `.prefab` of `.prefab.json`).
  const base = original.replace(/\.prefab\.json$/i, "").replace(/\.[^.]+$/, "") || "schematic";
  return `${base}-converted.${EXT[format]}`;
}

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
    async (gameId: GameId, files: File[]) => {
      if (!api) return;
      const s = store.getState();
      s.setError(undefined);
      s.setLoadingSource(true);
      s.setSourceScan({ pct: 0, msg: "" });
      try {
        const onProgress = proxy((pct: number, msg: string) =>
          store.getState().setSourceScan({ pct, msg })
        );
        const handle = await api.scanInstance(gameId, files, onProgress);
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
    async (gameId: GameId, files: File[]) => {
      if (!api) return;
      const s = store.getState();
      s.setError(undefined);
      s.setLoadingTarget(true);
      s.setTargetScan({ pct: 0, msg: "" });
      try {
        const onProgress = proxy((pct: number, msg: string) =>
          store.getState().setTargetScan({ pct, msg })
        );
        const handle = await api.scanInstance(gameId, files, onProgress);
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

  // ── Phase 4 — export ────────────────────────────────────────────────────────

  const exportSchematic = useCallback(
    async (format: ExportFormat) => {
      if (!api) return;
      const { schematic, targetReg, resolutions, diff } = store.getState();
      if (!schematic) return;
      store.getState().setError(undefined);
      store.getState().setExporting(true);
      let convertedId: string | null = null;
      try {
        let exportId = schematic.id;
        const map = buildExportResolutionMap(diff, resolutions);
        // Apply resolutions into a fresh worker-side schematic before serialising.
        if (targetReg && Object.keys(map).length > 0) {
          const res = await api.applyResolutions(schematic.id, map, [], targetReg.id);
          exportId = res.schematicId;
          convertedId = res.schematicId;
        }
        const blob = await api.export(exportId, format);
        triggerDownload(blob, convertedFilename(schematic.fileName, format));
      } catch (err) {
        store.getState().setError(errMsg(err));
      } finally {
        if (convertedId) await api.release(convertedId).catch(() => {});
        store.getState().setExporting(false);
      }
    },
    [api, store]
  );

  const exportRuleSet = useCallback(async () => {
    if (!api) return;
    const { resolutions, sourceReg, targetReg } = store.getState();
    const map = toResolutionMap(resolutions);
    if (Object.keys(map).length === 0) return;
    const fromVersion = sourceReg?.version ?? "?";
    const toVersion = targetReg?.version ?? "?";
    const meta: RuleSetMeta = {
      id: `mc-${fromVersion}-to-${toVersion}`,
      name: `Minecraft ${fromVersion} → ${toVersion}`,
      gameId: "minecraft",
      fromVersion,
      toVersion,
    };
    try {
      const json = await api.exportRuleSet(map, meta);
      triggerDownload(new Blob([json], { type: "application/json" }), `${meta.id}.ruleset.json`);
    } catch (err) {
      store.getState().setError(errMsg(err));
    }
  }, [api, store]);

  const importRuleSet = useCallback(
    async (file: File) => {
      if (!api) return;
      store.getState().setError(undefined);
      try {
        const ruleSet = await api.importRuleSet(await file.text());
        const diff = store.getState().diff;
        for (const { source, targetId } of exactRulePairs(ruleSet)) {
          const block = diff?.entries.find((e) => e.block.id === source)?.block ?? parseBlockState(source);
          store.getState().setResolution(block, targetId);
        }
      } catch (err) {
        store.getState().setError(errMsg(err));
      }
    },
    [api, store]
  );

  return {
    scanSourceInstance,
    scanTargetInstance,
    loadSchematic,
    analyze,
    exportSchematic,
    exportRuleSet,
    importRuleSet,
  };
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}
