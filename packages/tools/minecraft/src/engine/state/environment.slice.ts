import { gameMeta, type GameId } from "../adapters/game-adapter";
import type { RegistryHandle } from "../types";
import { DEFAULT_VANILLA_VERSION } from "../versions";
import type { EnvMode, EnvRole, EnvState, PendingScan, ScanProgress, SliceSet } from "./types";

/**
 * Environment slots, keyed by role instead of duplicated `source*` / `target*`
 * fields. Both slots always exist so the record type stays exact; a read-only
 * viewer simply never reads `envs.target`.
 *
 * Setters here only touch the environment. Switching a game or replacing a
 * registry invalidates conversion state too, but that cascade belongs to the
 * caller (see `useEnvironmentActions`) — a slice never writes another
 * subsystem's state.
 */
export interface EnvironmentSlice {
  envs: Record<EnvRole, EnvState>;
  pendingScan?: PendingScan;
  setEnvGame: (role: EnvRole, game: GameId) => void;
  setEnvRegistry: (role: EnvRole, handle: RegistryHandle | undefined) => void;
  setEnvScan: (role: EnvRole, scan: ScanProgress | undefined) => void;
  setEnvLoading: (role: EnvRole, v: boolean) => void;
  setEnvMode: (role: EnvRole, mode: EnvMode) => void;
  setVanillaVersion: (role: EnvRole, version: string) => void;
  setPendingScan: (p: PendingScan | undefined) => void;
  resetEnvironments: () => void;
}

function defaultEnv(): EnvState {
  return {
    game: "minecraft",
    registry: undefined,
    scan: undefined,
    envMode: "instance",
    vanillaVersion: DEFAULT_VANILLA_VERSION,
    isLoading: false,
  };
}

function defaultEnvs(): Record<EnvRole, EnvState> {
  return { source: defaultEnv(), target: defaultEnv() };
}

export function createEnvironmentSlice(set: SliceSet<EnvironmentSlice>): EnvironmentSlice {
  const patch = (role: EnvRole, next: Partial<EnvState>) =>
    set((state) => ({ envs: { ...state.envs, [role]: { ...state.envs[role], ...next } } }));

  return {
    envs: defaultEnvs(),
    pendingScan: undefined,

    setEnvGame: (role, game) =>
      set((state) => {
        const env = state.envs[role];
        if (env.game === game) return state;
        return {
          envs: {
            ...state.envs,
            [role]: {
              ...env,
              game,
              registry: undefined,
              // A game with no bundled registries can only offer the folder scan.
              envMode: gameMeta(game).hasBundledRegistries ? env.envMode : "instance",
            },
          },
        };
      }),

    setEnvRegistry: (role, handle) => patch(role, { registry: handle }),
    setEnvScan: (role, scan) => patch(role, { scan }),
    setEnvLoading: (role, isLoading) => patch(role, { isLoading }),
    setEnvMode: (role, envMode) => patch(role, { envMode }),
    setVanillaVersion: (role, vanillaVersion) => patch(role, { vanillaVersion }),
    setPendingScan: (p) => set({ pendingScan: p }),
    // Clears what a scan produced. The picked game, mode and vanilla version are
    // user configuration and survive a reset.
    resetEnvironments: () =>
      set((state) => ({
        envs: {
          source: { ...state.envs.source, registry: undefined, scan: undefined, isLoading: false },
          target: { ...state.envs.target, registry: undefined, scan: undefined, isLoading: false },
        },
        pendingScan: undefined,
      })),
  };
}
