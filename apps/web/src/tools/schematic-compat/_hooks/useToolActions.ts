"use client";

import { useCallback } from "react";
import { proxy, type Remote } from "comlink";
import type { CompatWorkerAPI } from "../_lib/worker/worker-api";
import { useToolStore } from "../_store/tool.store";
import type { EnvRole } from "../_store/tool.store";
import type { GameId } from "../_lib/adapters";
import type { ScanOverride } from "../_lib/pipeline/registry";
import { ERR, errorCode, errorDetail } from "../_lib/errors";
import type { ResolutionMap, RuleSetMeta, CompatDiff, RegistryHandle } from "../_lib/types";
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

  // Free a worker-side artifact (registry / schematic) whose UI handle we're
  // about to replace or discard. Without this every scan / schematic load leaves
  // its worker entry (a full BlockRegistry or block array) alive for the whole
  // session — unbounded memory growth over a long editing session.
  const releaseHandle = useCallback(
    async (id: string | undefined) => {
      if (id && api) await api.release(id).catch(() => {});
    },
    [api],
  );

  /**
   * Install a freshly built registry on one side. The target side additionally
   * pulls its block-id list (the replacement comboboxes read it).
   */
  const applyRegistry = useCallback(
    async (role: EnvRole, handle: RegistryHandle) => {
      if (role === "source") {
        store.getState().setSourceReg(handle);
      } else {
        store.getState().setTargetReg(handle);
        const ids = api ? await api.getRegistryBlockIds(handle.id) : [];
        store.getState().setTargetBlockIds(ids);
      }
      store.getState().setDiff(undefined);
    },
    [api, store],
  );

  const clearRegistry = useCallback(
    (role: EnvRole) => {
      if (role === "source") {
        store.getState().setSourceReg(undefined);
      } else {
        store.getState().setTargetReg(undefined);
        store.getState().setTargetBlockIds([]);
      }
    },
    [store],
  );

  /**
   * Build one side's environment from a picked game folder. When no launcher
   * layout is recognised the scan doesn't fail outright — it parks the collected
   * files in `pendingScan` so the UI can ask for the version + loader and retry
   * via {@link retryPendingScan}, which is what makes non-CurseForge and
   * hand-assembled folders usable.
   */
  const scanInstance = useCallback(
    async (role: EnvRole, gameId: GameId, files: File[], override?: ScanOverride) => {
      if (!api) return;
      const s = store.getState();
      const prevRegId = role === "source" ? s.sourceReg?.id : s.targetReg?.id;
      const setLoading = role === "source" ? s.setLoadingSource : s.setLoadingTarget;
      const setScan = role === "source" ? s.setSourceScan : s.setTargetScan;
      s.setError(undefined);
      s.setPendingScan(undefined);
      setLoading(true);
      setScan({ pct: 0, msg: "" });
      try {
        const onProgress = proxy((pct: number, msg: string) => {
          const st = store.getState();
          (role === "source" ? st.setSourceScan : st.setTargetScan)({ pct, msg });
        });
        const handle = await api.scanInstance(gameId, files, onProgress, override);
        await applyRegistry(role, handle);
      } catch (err) {
        const code = errorCode(err);
        if (code === ERR.instanceUndetected) {
          // Recoverable: ask the user for what detection couldn't find.
          store.getState().setPendingScan({ role, gameId, files });
        } else {
          store.getState().setError(errorDetail(err), code);
        }
        clearRegistry(role);
      } finally {
        // The outgoing registry is now replaced (or cleared on error); free it.
        await releaseHandle(prevRegId);
        const st = store.getState();
        (role === "source" ? st.setLoadingSource : st.setLoadingTarget)(false);
        (role === "source" ? st.setSourceScan : st.setTargetScan)(undefined);
      }
    },
    [api, store, releaseHandle, applyRegistry, clearRegistry],
  );

  const scanSourceInstance = useCallback(
    (gameId: GameId, files: File[]) => scanInstance("source", gameId, files),
    [scanInstance],
  );

  const scanTargetInstance = useCallback(
    (gameId: GameId, files: File[]) => scanInstance("target", gameId, files),
    [scanInstance],
  );

  /** Re-run the parked scan with the version/loader the user supplied by hand. */
  const retryPendingScan = useCallback(
    async (override: ScanOverride) => {
      const pending = store.getState().pendingScan;
      if (!pending) return;
      await scanInstance(pending.role, pending.gameId, pending.files, override);
    },
    [store, scanInstance],
  );

  const cancelPendingScan = useCallback(() => {
    store.getState().setPendingScan(undefined);
  }, [store]);

  /**
   * Build one side's environment from a bundled vanilla registry — no folder to
   * pick. Analysis never depended on a scan (the diff classifies by namespace
   * and only reads the source registry's game), so this is a full environment.
   */
  const loadVanillaEnv = useCallback(
    async (role: EnvRole, version: string) => {
      if (!api) return;
      const s = store.getState();
      const prevRegId = role === "source" ? s.sourceReg?.id : s.targetReg?.id;
      const setLoading = role === "source" ? s.setLoadingSource : s.setLoadingTarget;
      s.setError(undefined);
      s.setPendingScan(undefined);
      setLoading(true);
      try {
        const handle = await api.loadVanillaRegistry(version);
        await applyRegistry(role, handle);
      } catch (err) {
        store.getState().setError(errorDetail(err), errorCode(err));
        clearRegistry(role);
      } finally {
        await releaseHandle(prevRegId);
        const st = store.getState();
        (role === "source" ? st.setLoadingSource : st.setLoadingTarget)(false);
      }
    },
    [api, store, releaseHandle, applyRegistry, clearRegistry],
  );

  const loadSchematic = useCallback(
    async (file: File) => {
      if (!api) return;
      const s = store.getState();
      const prevSchematicId = s.schematic?.id;
      s.setError(undefined);
      s.setLoadingSchematic(true);
      try {
        const summary = await api.loadSchematic(file);
        store.getState().setSchematic(summary);
      } catch (err) {
        store.getState().setError(errorDetail(err), errorCode(err));
        store.getState().setSchematic(undefined);
      } finally {
        // The outgoing schematic is now replaced (or cleared on error); free it.
        await releaseHandle(prevSchematicId);
        store.getState().setLoadingSchematic(false);
      }
    },
    [api, store, releaseHandle]
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
      store.getState().setError(errorDetail(err), errorCode(err));
      store.getState().setDiff(undefined);
    } finally {
      store.getState().setAnalyzing(false);
    }
  }, [api, store]);

  // Switching a side's game clears that registry in the store (see setSourceGame /
  // setTargetGame). Route the change through here so the orphaned worker-side
  // registry is released instead of leaking.
  const changeSourceGame = useCallback(
    (gameId: GameId) => {
      const s = store.getState();
      if (s.sourceGame === gameId) return;
      const prevRegId = s.sourceReg?.id;
      s.setSourceGame(gameId);
      void releaseHandle(prevRegId);
    },
    [store, releaseHandle],
  );

  const changeTargetGame = useCallback(
    (gameId: GameId) => {
      const s = store.getState();
      if (s.targetGame === gameId) return;
      const prevRegId = s.targetReg?.id;
      s.setTargetGame(gameId);
      void releaseHandle(prevRegId);
    },
    [store, releaseHandle],
  );

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
        const blob = await api.export(exportId, format, targetReg?.dataVersion);
        // A prefab too large for one file comes back as a .zip of part prefabs
        // (worker sets the Blob type); swap the extension so the download is a .zip.
        const name = convertedFilename(schematic.fileName, format);
        const filename =
          blob.type === "application/zip" ? name.replace(/\.prefab\.json$/i, "-parts.zip") : name;
        triggerDownload(blob, filename);
      } catch (err) {
        store.getState().setError(errorDetail(err), errorCode(err));
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
    // Derive the ruleset's game/labels from the actual environments so a Hytale
    // (or cross-game) session isn't mislabelled as "Minecraft".
    const sourceGameId = sourceReg?.gameId ?? "minecraft";
    const targetGameId = targetReg?.gameId ?? "minecraft";
    const gameLabel = (g: GameId) => (g === "hytale" ? "Hytale" : "Minecraft");
    const meta: RuleSetMeta = {
      id: `${sourceGameId}-${fromVersion}-to-${targetGameId}-${toVersion}`,
      name: `${gameLabel(sourceGameId)} ${fromVersion} → ${gameLabel(targetGameId)} ${toVersion}`,
      gameId: sourceGameId,
      fromVersion,
      toVersion,
    };
    try {
      const json = await api.exportRuleSet(map, meta);
      triggerDownload(new Blob([json], { type: "application/json" }), `${meta.id}.ruleset.json`);
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
          const block = diff?.entries.find((e) => e.block.id === source)?.block ?? parseBlockState(source);
          store.getState().setResolution(block, targetId);
        }
      } catch (err) {
        store.getState().setError(errorDetail(err), errorCode(err));
      }
    },
    [api, store]
  );

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
