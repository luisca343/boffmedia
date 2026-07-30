import { create } from "zustand";
import {
  createDocumentSlice,
  createEnvironmentSlice,
  createErrorSlice,
  createViewerSlice,
  type DocumentSlice,
  type EnvironmentSlice,
  type ErrorSlice,
  type EnvRole,
  type ViewerSlice,
} from "@/lib/schematic/state";
import { createConversionSlice, type ConversionSlice } from "./conversion.slice";
import { createDiffUiSlice, type DiffUiSlice } from "./diff-ui.slice";

export type { EnvMode, EnvRole, NavMode, PendingScan } from "@/lib/schematic/state";
export type { PreviewMode } from "./conversion.slice";

/**
 * Composed from independent slices: document, viewer and environment come from
 * `lib/schematic/state` (a read-only viewer composes the same ones), conversion
 * and diff-ui are this tool's alone (diff-ui is separate from conversion so
 * DiffPanel's filter state survives its own unmount — RF-12).
 *
 * No slice writes another slice's state. Loading a document does not silently
 * discard a diff — that cascade is orchestrated in the action layer, where it
 * is visible (see `useToolActions`).
 */
export interface ToolState
  extends DocumentSlice,
    ViewerSlice,
    EnvironmentSlice,
    ErrorSlice,
    ConversionSlice,
    DiffUiSlice {
  reset: () => void;
}

export const useToolStore = create<ToolState>((set, get) => ({
  ...createDocumentSlice(set),
  ...createViewerSlice(set),
  ...createEnvironmentSlice(set),
  ...createErrorSlice(set),
  ...createConversionSlice(set),
  ...createDiffUiSlice(set),

  reset: () => {
    const s = get();
    s.resetDocument();
    s.resetViewer();
    s.resetEnvironments();
    s.resetConversion();
    s.resetDiffUi();
    s.setError(undefined);
  },
}));

/** Selector for one environment slot — `useToolStore(selectEnv("source"))`. */
export const selectEnv = (role: EnvRole) => (s: ToolState) => s.envs[role];
