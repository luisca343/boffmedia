"use client";

import { useCallback } from "react";
import type { Remote } from "comlink";
import type { GameId } from "../../engine/adapters/game-adapter";
import { errorCode, errorDetail } from "../../engine/errors";
import { parseBlockState } from "../../engine/normalizer";
import type { EnvRole } from "../../engine/state";
import type { ExportFormat, RegistryHandle, RuleSetMeta } from "../../engine/types";
import { convertedFilename, partsArchiveName } from "../_lib/export/filename";
import { triggerDownload } from "../_lib/export/download";
import { buildExportResolutionMap, toResolutionMap } from "../_lib/pipeline/resolution-map";
import { exactRulePairs } from "../_lib/pipeline/rules/ruleset";
import type { CompatWorkerAPI } from "../_lib/worker/worker-api";
import { useToolStore } from "../_store/tool.store";

const gameLabel = (g: GameId) => (g === "hytale" ? "Hytale" : "Minecraft");

/**
 * Everything that only exists because this tool converts: analysis, export, and
 * rule-set round-tripping. Also owns the conversion-side reactions to document
 * and environment changes, which the shared action hooks report but never apply
 * themselves.
 */
export function useConversionActions(api: Remote<CompatWorkerAPI> | null) {
  const store = useToolStore;

  /**
   * A new document has its own palette, so the previous document's diff and
   * per-block choices would apply to whichever ids happen to coincide. The
   * target block-id list survives — it belongs to the registry, not the document.
   */
  const onDocumentChanged = useCallback(() => {
    const s = store.getState();
    s.setDiff(undefined);
    s.clearResolutions();
  }, [store]);

  /**
   * A new registry invalidates the diff, and — on the target side — every
   * resolution, since choices name blocks in the OLD target registry and a stale
   * one would silently ride along into the next export.
   */
  const onRegistryApplied = useCallback(
    async (role: EnvRole, handle: RegistryHandle) => {
      const s = store.getState();
      if (role === "target") {
        s.clearResolutions();
        s.setTargetBlockIds(api ? await api.getRegistryBlockIds(handle.id) : []);
      }
      store.getState().setDiff(undefined);
    },
    [api, store],
  );

  const onRegistryCleared = useCallback(
    (role: EnvRole) => {
      if (role !== "target") return;
      const s = store.getState();
      s.clearResolutions();
      s.setTargetBlockIds([]);
    },
    [store],
  );

  const onGameChanged = useCallback(
    (role: EnvRole) => {
      const s = store.getState();
      s.setDiff(undefined);
      // Choices name blocks in the outgoing game's registry.
      s.clearResolutions();
      if (role === "target") s.setTargetBlockIds([]);
    },
    [store],
  );

  const analyze = useCallback(async () => {
    if (!api) return;
    const { schematic, envs } = store.getState();
    const sourceReg = envs.source.registry;
    const targetReg = envs.target.registry;
    if (!schematic || !sourceReg || !targetReg) return;
    store.getState().setError(undefined);
    store.getState().setAnalyzing(true);
    try {
      const diff = await api.computeDiff(schematic.id, sourceReg.id, targetReg.id);
      store.getState().setDiff(diff);
    } catch (err) {
      store.getState().setError(errorDetail(err), errorCode(err));
      store.getState().setDiff(undefined);
    } finally {
      store.getState().setAnalyzing(false);
    }
  }, [api, store]);

  const exportSchematic = useCallback(
    async (format: ExportFormat) => {
      if (!api) return;
      const { schematic, envs, resolutions, diff } = store.getState();
      const targetReg = envs.target.registry;
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
        const blob = await api.export(exportId, format, targetReg?.dataVersion);
        const name = convertedFilename(schematic.fileName, format);
        await triggerDownload(blob, blob.type === "application/zip" ? partsArchiveName(name) : name);
      } catch (err) {
        store.getState().setError(errorDetail(err), errorCode(err));
      } finally {
        if (convertedId) await api.release(convertedId).catch(() => {});
        store.getState().setExporting(false);
      }
    },
    [api, store],
  );

  const exportRuleSet = useCallback(async () => {
    if (!api) return;
    const { resolutions, envs } = store.getState();
    const sourceReg = envs.source.registry;
    const targetReg = envs.target.registry;
    const map = toResolutionMap(resolutions);
    if (Object.keys(map).length === 0) return;
    const fromVersion = sourceReg?.version ?? "?";
    const toVersion = targetReg?.version ?? "?";
    // Derive the ruleset's game/labels from the actual environments so a Hytale
    // (or cross-game) session isn't mislabelled as "Minecraft".
    const sourceGameId = sourceReg?.gameId ?? "minecraft";
    const targetGameId = targetReg?.gameId ?? "minecraft";
    const meta: RuleSetMeta = {
      id: `${sourceGameId}-${fromVersion}-to-${targetGameId}-${toVersion}`,
      name: `${gameLabel(sourceGameId)} ${fromVersion} → ${gameLabel(targetGameId)} ${toVersion}`,
      gameId: sourceGameId,
      fromVersion,
      toVersion,
    };
    try {
      const json = await api.exportRuleSet(map, meta);
      await triggerDownload(new Blob([json], { type: "application/json" }), `${meta.id}.ruleset.json`);
    } catch (err) {
      store.getState().setError(errorDetail(err), errorCode(err));
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
          const block =
            diff?.entries.find((e) => e.block.id === source)?.block ?? parseBlockState(source);
          store.getState().setResolution(block, targetId);
        }
      } catch (err) {
        store.getState().setError(errorDetail(err), errorCode(err));
      }
    },
    [api, store],
  );

  return {
    analyze,
    exportSchematic,
    exportRuleSet,
    importRuleSet,
    onDocumentChanged,
    onRegistryApplied,
    onRegistryCleared,
    onGameChanged,
  };
}
