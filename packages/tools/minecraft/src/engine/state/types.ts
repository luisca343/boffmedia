import type { GameId } from "../adapters/game-adapter";
import type { RegistryHandle } from "../types";

/**
 * Slice creators take zustand's `set`/`get` narrowed to their own slice. A store
 * composing several slices passes its own `set`/`get` straight through: a
 * `Partial<Slice>` is a valid `Partial<Store>` whenever the store contains the
 * slice, so composition needs no casts.
 */
export type SliceSet<S> = (partial: Partial<S> | ((state: S) => Partial<S>)) => void;
export type SliceGet<S> = () => S;

/** A store handle the action hooks read through — satisfied by any zustand store. */
export interface StoreLike<S> {
  getState: () => S;
  subscribe: (listener: () => void) => () => void;
}

export type NavMode = "orbit" | "fly";

/** How a side sources its environment: scan an install, or use a bundled registry. */
export type EnvMode = "instance" | "vanilla";

/**
 * Named environment slots. A conversion tool fills both; a read-only viewer
 * fills only `source` and never reads `target`.
 */
export type EnvRole = "source" | "target";

export interface ScanProgress {
  pct: number;
  msg: string;
}

/**
 * A scan that stopped because no launcher layout was recognised. Holds the
 * already-collected files so answering the version/loader prompt re-runs the
 * scan without making the user pick the folder a second time.
 */
export interface PendingScan {
  role: EnvRole;
  gameId: GameId;
  files: File[];
}

/** Everything one environment slot owns. */
export interface EnvState {
  game: GameId;
  /** Worker-held registry, referenced by handle. */
  registry?: RegistryHandle;
  scan?: ScanProgress;
  envMode: EnvMode;
  vanillaVersion: string;
  isLoading: boolean;
}
