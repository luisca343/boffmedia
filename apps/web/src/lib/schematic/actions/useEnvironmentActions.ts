"use client";

import { useCallback } from "react";
import { proxy } from "comlink";
import type { GameId } from "../adapters/game-adapter";
import { ERR, errorCode, errorDetail } from "../errors";
import type { RegistryHandle, ScanOverride } from "../types";
import type { EnvironmentSlice, EnvRole, ErrorSlice, StoreLike } from "../state";
import { useReleaseHandle } from "./useReleaseHandle";
import type { EnvironmentApi } from "./worker-contracts";

type EnvironmentStore = EnvironmentSlice & ErrorSlice;

export interface EnvironmentActionsOptions {
  /** A registry was installed on a slot. Awaited before the scan finishes. */
  onRegistryApplied?: (role: EnvRole, handle: RegistryHandle) => void | Promise<void>;
  /** A slot's registry was dropped (scan failed, or the game changed). */
  onRegistryCleared?: (role: EnvRole) => void;
  /** A slot switched games, invalidating anything derived from its registry. */
  onGameChanged?: (role: EnvRole, game: GameId) => void;
}

/**
 * Building a slot's environment: scan a real install, or load a bundled vanilla
 * registry. The cross-subsystem consequences of a new registry (a stale diff, a
 * stale block-id list) are reported through the callbacks rather than written
 * here, so a viewer that has no such state passes nothing.
 */
export function useEnvironmentActions<S extends EnvironmentStore>(
  store: StoreLike<S>,
  api: EnvironmentApi | null,
  options: EnvironmentActionsOptions = {},
) {
  const { onRegistryApplied, onRegistryCleared, onGameChanged } = options;
  const releaseHandle = useReleaseHandle(api);

  const applyRegistry = useCallback(
    async (role: EnvRole, handle: RegistryHandle) => {
      store.getState().setEnvRegistry(role, handle);
      await onRegistryApplied?.(role, handle);
    },
    [store, onRegistryApplied],
  );

  const clearRegistry = useCallback(
    (role: EnvRole) => {
      store.getState().setEnvRegistry(role, undefined);
      onRegistryCleared?.(role);
    },
    [store, onRegistryCleared],
  );

  /**
   * When no launcher layout is recognised the scan doesn't fail outright — it
   * parks the collected files in `pendingScan` so the UI can ask for the version
   * + loader and retry via {@link retryPendingScan}, which is what makes
   * non-CurseForge and hand-assembled folders usable.
   */
  const scanInstance = useCallback(
    async (role: EnvRole, gameId: GameId, files: File[], override?: ScanOverride) => {
      if (!api) return;
      const s = store.getState();
      const prevRegId = s.envs[role].registry?.id;
      s.setError(undefined);
      s.setPendingScan(undefined);
      s.setEnvLoading(role, true);
      s.setEnvScan(role, { pct: 0, msg: "" });
      try {
        const onProgress = proxy((pct: number, msg: string) => {
          store.getState().setEnvScan(role, { pct, msg });
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
        st.setEnvLoading(role, false);
        st.setEnvScan(role, undefined);
      }
    },
    [api, store, releaseHandle, applyRegistry, clearRegistry],
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
   * Build a slot's environment from a bundled vanilla registry — no folder to
   * pick, and no `E_INSTANCE_UNDETECTED` dead end.
   */
  const loadVanillaEnv = useCallback(
    async (role: EnvRole, version: string) => {
      if (!api) return;
      const s = store.getState();
      const prevRegId = s.envs[role].registry?.id;
      s.setError(undefined);
      s.setPendingScan(undefined);
      s.setEnvLoading(role, true);
      try {
        const handle = await api.loadVanillaRegistry(version);
        await applyRegistry(role, handle);
      } catch (err) {
        store.getState().setError(errorDetail(err), errorCode(err));
        clearRegistry(role);
      } finally {
        await releaseHandle(prevRegId);
        store.getState().setEnvLoading(role, false);
      }
    },
    [api, store, releaseHandle, applyRegistry, clearRegistry],
  );

  /**
   * Switching a slot's game drops its registry, so route the change through here
   * — the orphaned worker-side registry is released instead of leaking.
   */
  const changeGame = useCallback(
    (role: EnvRole, gameId: GameId) => {
      const s = store.getState();
      if (s.envs[role].game === gameId) return;
      const prevRegId = s.envs[role].registry?.id;
      s.setEnvGame(role, gameId);
      onGameChanged?.(role, gameId);
      void releaseHandle(prevRegId);
    },
    [store, releaseHandle, onGameChanged],
  );

  return {
    scanInstance,
    retryPendingScan,
    cancelPendingScan,
    loadVanillaEnv,
    changeGame,
    releaseHandle,
  };
}
