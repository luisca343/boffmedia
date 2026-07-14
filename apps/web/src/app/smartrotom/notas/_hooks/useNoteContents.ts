"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import type { NoteVM } from "../_types";

/**
 * Backlinks and the knowledge graph are derived from note BODIES, but the list
 * endpoint returns previews only (no content). Without hydrating the bodies, a
 * note that links here stays invisible until the user happens to open it in the
 * same session — which is why backlinks read as "broken".
 */
export function useNoteContents(notes: NoteVM[]) {
  const [contentById, setContentById] = useState<Record<number, string>>({});
  const inFlight = useRef(new Set<number>());

  const cacheContent = useCallback((id: number, content: string) => {
    setContentById((prev) => (prev[id] === content ? prev : { ...prev, [id]: content }));
  }, []);

  useEffect(() => {
    const missing = notes.filter(
      (n) => contentById[n.id] == null && !inFlight.current.has(n.id),
    );
    if (missing.length === 0) return;
    for (const n of missing) inFlight.current.add(n.id);

    let cancelled = false;
    void Promise.all(
      missing.map((n) =>
        DocumentsService.getDocument(n.id)
          // A failed read resolves to `{ success: false }`; caching "" for it would
          // silently drop every link the note holds, so leave it unresolved and let
          // the next pass retry.
          .then((r) => [n.id, r.success ? r.data?.content ?? "" : null] as const)
          .catch(() => [n.id, null] as const),
      ),
    ).then((pairs) => {
      for (const [id] of pairs) inFlight.current.delete(id);
      if (cancelled) return;
      setContentById((prev) => {
        const next = { ...prev };
        for (const [id, content] of pairs) if (content != null) next[id] = content;
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [notes, contentById]);

  return { contentById, cacheContent };
}
