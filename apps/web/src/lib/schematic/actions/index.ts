/**
 * Orchestration between a schematic tool's UI and its worker. Store writes stay
 * declarative and components stay free of engine plumbing.
 *
 * Kept out of the `@/lib/schematic` barrel — that barrel is imported by the
 * worker, and React code must never reach the worker bundle.
 */

export type {
  DocumentApi,
  EnvironmentApi,
  PositionsApi,
  ReleasableApi,
} from "./worker-contracts";

export { useReleaseHandle } from "./useReleaseHandle";
export { useDocumentActions, type DocumentActionsOptions } from "./useDocumentActions";
export { useEnvironmentActions, type EnvironmentActionsOptions } from "./useEnvironmentActions";
export { useSchematicPositions } from "./useSchematicPositions";
export { useViewerShortcuts } from "./useViewerShortcuts";
export { useSelectionFocus, type SelectionFocusResult } from "./useSelectionFocus";
export { useInstanceFilePicker, type UseInstanceFilePickerReturn } from "./useInstanceFilePicker";
