import type { SchematicSummary, WorldIdSummary } from "../types";
import type { SliceSet } from "./types";

/**
 * The loaded structure file, and nothing else. Replacing the document does not
 * reach into any other subsystem — callers that need the viewer re-armed or a
 * conversion discarded orchestrate that explicitly (see `useDocumentActions`).
 *
 * The attached world (`worldIds`) outlives a document swap on purpose: one
 * `level.dat` names the mod blocks of every schematic cut from that world, so
 * loading a second file from the same save should not ask for it again.
 */
export interface DocumentSlice {
  schematic?: SchematicSummary;
  isLoadingSchematic: boolean;
  worldIds?: WorldIdSummary;
  setSchematic: (s: SchematicSummary | undefined) => void;
  setLoadingSchematic: (v: boolean) => void;
  setWorldIds: (w: WorldIdSummary | undefined) => void;
  resetDocument: () => void;
}

export function createDocumentSlice(set: SliceSet<DocumentSlice>): DocumentSlice {
  return {
    schematic: undefined,
    isLoadingSchematic: false,
    worldIds: undefined,
    setSchematic: (s) => set({ schematic: s }),
    setLoadingSchematic: (v) => set({ isLoadingSchematic: v }),
    setWorldIds: (w) => set({ worldIds: w }),
    resetDocument: () => set({ schematic: undefined, isLoadingSchematic: false }),
  };
}
