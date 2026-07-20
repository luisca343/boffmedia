/**
 * Reusable zustand slices for a schematic tool's state. Each slice owns one
 * subsystem and writes nothing outside it; a tool composes the ones it needs
 * and orchestrates cross-slice effects in its action layer.
 *
 * Kept out of the `@/lib/schematic` barrel on purpose — that barrel is imported
 * by the worker, and state/render code must never reach the worker bundle.
 */

export type {
  EnvMode,
  EnvRole,
  EnvState,
  NavMode,
  PendingScan,
  ScanProgress,
  SliceGet,
  SliceSet,
  StoreLike,
} from "./types";

export { createDocumentSlice, type DocumentSlice } from "./document.slice";
export { createViewerSlice, type ViewerSlice } from "./viewer.slice";
export { createEnvironmentSlice, type EnvironmentSlice } from "./environment.slice";
export { createErrorSlice, type ErrorSlice } from "./error.slice";
