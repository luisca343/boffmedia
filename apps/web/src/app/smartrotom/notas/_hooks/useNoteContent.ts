"use client";

import { useRotomRequest } from "@/hooks/useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import type { Document } from "@boffmedia/shared";

// Loads a note's full content (previews omit it for list perf).
export function useNoteContent(id: number | null) {
  const req = useRotomRequest<Document>(DocumentsService.getDocument, id ?? 0);
  return {
    note: id ? req.data : undefined,
    isLoading: req.isLoading,
    refetch: req.refetch,
  };
}
