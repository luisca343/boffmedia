import type { SchematicSummary } from "../types";
import type { SliceSet } from "./types";

/**
 * The loaded structure file, and nothing else. Replacing the document does not
 * reach into any other subsystem — callers that need the viewer re-armed or a
 * conversion discarded orchestrate that explicitly (see `useDocumentActions`).
 */
export interface DocumentSlice {
  schematic?: SchematicSummary;
  isLoadingSchematic: boolean;
  setSchematic: (s: SchematicSummary | undefined) => void;
  setLoadingSchematic: (v: boolean) => void;
  resetDocument: () => void;
}

export function createDocumentSlice(set: SliceSet<DocumentSlice>): DocumentSlice {
  return {
    schematic: undefined,
    isLoadingSchematic: false,
    setSchematic: (s) => set({ schematic: s }),
    setLoadingSchematic: (v) => set({ isLoadingSchematic: v }),
    resetDocument: () => set({ schematic: undefined, isLoadingSchematic: false }),
  };
}
