"use client";

import { useCallback } from "react";
import { errorCode, errorDetail } from "../errors";
import type { SchematicSummary } from "../types";
import type { DocumentSlice, ErrorSlice, StoreLike, ViewerSlice } from "../state";
import { useReleaseHandle } from "./useReleaseHandle";
import type { DocumentApi } from "./worker-contracts";

type DocumentStore = DocumentSlice & ViewerSlice & ErrorSlice;

export interface DocumentActionsOptions {
  /**
   * Runs after the document (and the viewer) has been swapped, including on a
   * failed load, where the summary is `undefined`. This is the seam a
   * conversion tool uses to discard diff/resolution state — the document slice
   * itself never reaches into another subsystem.
   */
  onDocumentChanged?: (schematic: SchematicSummary | undefined) => void;
}

/**
 * Loading a structure file: parse it in the worker, install the summary, re-arm
 * the viewer, and free the outgoing worker-side document.
 */
export function useDocumentActions<S extends DocumentStore>(
  store: StoreLike<S>,
  api: DocumentApi | null,
  options: DocumentActionsOptions = {},
) {
  const { onDocumentChanged } = options;
  const releaseHandle = useReleaseHandle(api);

  const applyDocument = useCallback(
    (summary: SchematicSummary | undefined) => {
      const s = store.getState();
      s.setSchematic(summary);
      s.resetViewerFor(summary);
      onDocumentChanged?.(summary);
    },
    [store, onDocumentChanged],
  );

  const loadSchematic = useCallback(
    async (file: File) => {
      if (!api) return;
      const s = store.getState();
      const prevSchematicId = s.schematic?.id;
      s.setError(undefined);
      s.setLoadingSchematic(true);
      try {
        applyDocument(await api.loadSchematic(file));
      } catch (err) {
        store.getState().setError(errorDetail(err), errorCode(err));
        applyDocument(undefined);
      } finally {
        // The outgoing document is now replaced (or cleared on error); free it.
        await releaseHandle(prevSchematicId);
        store.getState().setLoadingSchematic(false);
      }
    },
    [api, store, releaseHandle, applyDocument],
  );

  return { loadSchematic };
}
