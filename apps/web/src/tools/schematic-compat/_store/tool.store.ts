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

export type { EnvMode, EnvRole, NavMode, PendingScan } from "@/lib/schematic/state";
export type { PreviewMode } from "./conversion.slice";

/**
 * Composed from independent slices: document, viewer and environment come from
 * `lib/schematic/state` (a read-only viewer composes the same ones), conversion
 * is this tool's alone.
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
    ConversionSlice {
  reset: () => void;
}

export const useToolStore = create<ToolState>((set, get) => ({
  ...createDocumentSlice(set),
  ...createViewerSlice(set),
  ...createEnvironmentSlice(set),
  ...createErrorSlice(set),
  ...createConversionSlice(set),

  reset: () => {
    const s = get();
    s.resetDocument();
    s.resetViewer();
    s.resetEnvironments();
    s.resetConversion();
    s.setError(undefined);
  },
}));

/** Selector for one environment slot — `useToolStore(selectEnv("source"))`. */
export const selectEnv = (role: EnvRole) => (s: ToolState) => s.envs[role];
