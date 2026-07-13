"use client";

import { useCallback, useEffect, useState } from "react";
import { useBoffSession } from "@/services/useBoffSession";
import { useRotomRequest } from "@/hooks/useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import type { ApiResponse } from "@/services/boffAPI";
import type { NoteFolder, NoteTag, NotePreview } from "@boffmedia/shared";
import { toast } from "../_components/ui";
import { toMs } from "../_utils/format";
import type { NoteVM } from "../_types";
import type { ColorKey } from "../_utils/colors";

function toVM(n: NotePreview): NoteVM {
  return { ...n, createdMs: toMs(n.createdAt), updatedMs: toMs(n.updatedAt) };
}

export function useNotesData() {
  const { session } = useBoffSession();
  const uuid = session?.user.smartRotomUser?.uuid ?? "";
  const [mutationError, setError] = useState<string | null>(null);

  /**
   * `boffAPI` only throws on network errors: an HTTP failure RESOLVES to
   * `{ success: false }`. An unchecked mutation therefore looks exactly like a
   * successful save, which is silent data loss on a note the user just typed.
   */
  const run = useCallback(
    async <T,>(call: Promise<ApiResponse<T>>, fallback: string): Promise<ApiResponse<T> | null> => {
      try {
        const res = await call;
        if (!res?.success) throw new Error(res?.message || fallback);
        setError(null);
        return res;
      } catch (e) {
        const msg = e instanceof Error && e.message ? e.message : fallback;
        setError(msg);
        toast(msg, "error");
        return null;
      }
    },
    [],
  );

  const notesReq = useRotomRequest<NotePreview[]>(DocumentsService.getUserNotes, uuid);
  const foldersReq = useRotomRequest<NoteFolder[]>(DocumentsService.getFolders, uuid);
  const tagsReq = useRotomRequest<NoteTag[]>(DocumentsService.getTags, uuid);
  const trashReq = useRotomRequest<NotePreview[]>(DocumentsService.getTrash, uuid);

  const notes: NoteVM[] = (notesReq.data ?? []).map(toVM);
  const trash: NoteVM[] = (trashReq.data ?? []).map(toVM);
  const folders = foldersReq.data ?? [];
  const tags = tagsReq.data ?? [];

  const refetchNotes = notesReq.refetch;
  const refetchTrash = trashReq.refetch;

  const readError = notesReq.error ?? foldersReq.error ?? tagsReq.error ?? trashReq.error ?? null;
  useEffect(() => {
    if (readError) toast(readError, "error");
  }, [readError]);

  // ---- note mutations ----
  const newNote = useCallback(
    async (init?: { title?: string; content?: string; folderId?: number | null }) => {
      const title = init?.title || "Nueva nota";
      const res = await run(
        DocumentsService.createNote({
          title,
          content: init?.content ?? `<h1>${title}</h1><p><br></p>`,
          type: 0,
          uuid,
        }),
        "No se pudo crear la nota",
      );
      const id = res?.data?.id;
      if (id == null) return null;
      if (init?.folderId != null) {
        await run(
          DocumentsService.updateDocument(id, { folderId: init.folderId }),
          "La nota se creó, pero no se pudo mover a la carpeta",
        );
      }
      await refetchNotes();
      return id;
    },
    [uuid, refetchNotes, run],
  );

  const saveNote = useCallback(
    async (id: number, data: { title?: string; content?: string }) => {
      const ok = !!(await run(DocumentsService.updateDocument(id, data), "No se pudo guardar la nota"));
      await refetchNotes();
      return ok;
    },
    [refetchNotes, run],
  );

  const setPinned = useCallback(
    async (id: number, pinned: boolean) => {
      const ok = !!(await run(
        DocumentsService.updateDocument(id, { pinned: pinned ? 1 : 0 }),
        pinned ? "No se pudo anclar la nota" : "No se pudo desanclar la nota",
      ));
      await refetchNotes();
      return ok;
    },
    [refetchNotes, run],
  );

  const moveNote = useCallback(
    async (id: number, folderId: number | null) => {
      const ok = !!(await run(DocumentsService.updateDocument(id, { folderId }), "No se pudo mover la nota"));
      await refetchNotes();
      return ok;
    },
    [refetchNotes, run],
  );

  const setPublic = useCallback(
    async (id: number, isPublic: boolean) => {
      const ok = !!(await run(
        DocumentsService.updateDocument(id, { public: isPublic ? 1 : 0 }),
        "No se pudo cambiar la visibilidad de la nota",
      ));
      await refetchNotes();
      return ok;
    },
    [refetchNotes, run],
  );

  const toggleTag = useCallback(
    async (id: number, tagId: number) => {
      const ok = !!(await run(DocumentsService.toggleNoteTag(id, tagId), "No se pudo aplicar la etiqueta"));
      await refetchNotes();
      return ok;
    },
    [refetchNotes, run],
  );

  const deleteNote = useCallback(
    async (id: number) => {
      const ok = !!(await run(DocumentsService.deleteDocument(id), "No se pudo eliminar la nota"));
      await Promise.all([refetchNotes(), refetchTrash()]);
      return ok;
    },
    [refetchNotes, refetchTrash, run],
  );

  const restoreNote = useCallback(
    async (id: number) => {
      const ok = !!(await run(DocumentsService.restoreDocument(id), "No se pudo restaurar la nota"));
      await Promise.all([refetchNotes(), refetchTrash()]);
      return ok;
    },
    [refetchNotes, refetchTrash, run],
  );

  const purgeNote = useCallback(
    async (id: number) => {
      const ok = !!(await run(DocumentsService.purgeDocument(id), "No se pudo borrar la nota definitivamente"));
      await refetchTrash();
      return ok;
    },
    [refetchTrash, run],
  );

  const shareNote = useCallback(
    async (id: number, targetUuid: string) => {
      const ok = !!(await run(DocumentsService.addNoteToUser(id, targetUuid), "No se pudo compartir la nota"));
      await refetchNotes();
      return ok;
    },
    [refetchNotes, run],
  );

  const unshareNote = useCallback(
    async (id: number, targetUuid: string) => {
      const ok = !!(await run(
        DocumentsService.removeNoteFromUser(id, targetUuid),
        "No se pudo dejar de compartir la nota",
      ));
      await refetchNotes();
      return ok;
    },
    [refetchNotes, run],
  );

  // ---- folder / tag mutations ----
  const createFolder = useCallback(
    async (name: string, color: ColorKey = "primary", parentId: number | null = null) => {
      const ok = !!(await run(
        DocumentsService.createFolder({ uuid, name, color, parentId }),
        "No se pudo crear la carpeta",
      ));
      await foldersReq.refetch();
      return ok;
    },
    [uuid, foldersReq, run],
  );

  const deleteFolder = useCallback(
    async (id: number) => {
      const ok = !!(await run(DocumentsService.deleteFolder(id), "No se pudo eliminar la carpeta"));
      await Promise.all([foldersReq.refetch(), refetchNotes()]);
      return ok;
    },
    [foldersReq, refetchNotes, run],
  );

  const createTag = useCallback(
    async (label: string, color: ColorKey = "primary") => {
      const ok = !!(await run(DocumentsService.createTag({ uuid, label, color }), "No se pudo crear la etiqueta"));
      await tagsReq.refetch();
      return ok;
    },
    [uuid, tagsReq, run],
  );

  const deleteTag = useCallback(
    async (id: number) => {
      const ok = !!(await run(DocumentsService.deleteTag(id), "No se pudo eliminar la etiqueta"));
      await Promise.all([tagsReq.refetch(), refetchNotes()]);
      return ok;
    },
    [tagsReq, refetchNotes, run],
  );

  return {
    uuid,
    notes,
    trash,
    folders,
    tags,
    error: mutationError ?? readError,
    isLoading: notesReq.isLoading || foldersReq.isLoading || tagsReq.isLoading,
    actions: {
      newNote,
      saveNote,
      setPinned,
      moveNote,
      setPublic,
      toggleTag,
      deleteNote,
      restoreNote,
      purgeNote,
      shareNote,
      unshareNote,
      createFolder,
      deleteFolder,
      createTag,
      deleteTag,
      refetchNotes,
    },
  };
}

export type NotesData = ReturnType<typeof useNotesData>;
export type NotesActions = NotesData["actions"];
