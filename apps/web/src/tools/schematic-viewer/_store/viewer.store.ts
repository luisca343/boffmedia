import { create } from "zustand";
import {
  createDocumentSlice,
  createEnvironmentSlice,
  createErrorSlice,
  createViewerSlice,
  type DocumentSlice,
  type EnvironmentSlice,
  type ErrorSlice,
  type ViewerSlice,
} from "@/lib/schematic/state";

export type { NavMode } from "@/lib/schematic/state";

/**
 * Four shared slices, no tool-specific one — a read-only viewer adds no state of
 * its own beyond what the engine already models.
 *
 * The environment slice keeps both its `source` and `target` slots, and this tool
 * only ever reads `source`. That is the slice's documented read-only-viewer
 * contract, and it buys `useEnvironmentActions.loadVanillaEnv` verbatim:
 * loading/error bookkeeping plus release-on-swap of the outgoing registry. A
 * local one-off handle would have to reimplement all three.
 */
export interface ViewerState extends DocumentSlice, ViewerSlice, EnvironmentSlice, ErrorSlice {}

export const useViewerStore = create<ViewerState>((set) => ({
  ...createDocumentSlice(set),
  ...createViewerSlice(set),
  ...createEnvironmentSlice(set),
  ...createErrorSlice(set),
}));

/** The one environment this tool has: the picked bundled version. */
export const selectEnvironment = (s: ViewerState) => s.envs.source;
