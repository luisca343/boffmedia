"use client";

import { useCallback } from "react";
import { useBoffSession } from "@/services/useBoffSession";
import { useRotomRequest } from "@/hooks/useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import type { NoteFolder, NoteTag, NotePreview } from "@boffmedia/shared";
import { toMs } from "../_utils/format";
import type { NoteVM } from "../_types";
import type { ColorKey } from "../_utils/colors";

function toVM(n: NotePreview): NoteVM {
  return { ...n, createdMs: toMs(n.createdAt), updatedMs: toMs(n.updatedAt) };
}

export function useNotesData() {
  const { session } = useBoffSession();
  const uuid = session?.user.smartRotomUser?.uuid ?? "";

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

  // ---- note mutations ----
  const newNote = useCallback(
    async (init?: { title?: string; content?: string; folderId?: number | null }) => {
      const title = init?.title || "Nueva nota";
      const res = await DocumentsService.createNote({
        title,
        content: init?.content ?? `<h1>${title}</h1><p><br></p>`,
        type: 0,
        uuid,
      });
      const id = res.data?.id;
      if (id != null && init?.folderId != null) {
        await DocumentsService.updateDocument(id, { folderId: init.folderId });
      }
      await refetchNotes();
      return id ?? null;
    },
    [uuid, refetchNotes],
  );

  const saveNote = useCallback(
    async (id: number, data: { title?: string; content?: string }) => {
      await DocumentsService.updateDocument(id, data);
      await refetchNotes();
    },
    [refetchNotes],
  );

  const setPinned = useCallback(
    async (id: number, pinned: boolean) => {
      await DocumentsService.updateDocument(id, { pinned: pinned ? 1 : 0 });
      await refetchNotes();
    },
    [refetchNotes],
  );

  const moveNote = useCallback(
    async (id: number, folderId: number | null) => {
      await DocumentsService.updateDocument(id, { folderId });
      await refetchNotes();
    },
    [refetchNotes],
  );

  const setPublic = useCallback(
    async (id: number, isPublic: boolean) => {
      await DocumentsService.updateDocument(id, { public: isPublic ? 1 : 0 });
      await refetchNotes();
    },
    [refetchNotes],
  );

  const toggleTag = useCallback(
    async (id: number, tagId: number) => {
      await DocumentsService.toggleNoteTag(id, tagId);
      await refetchNotes();
    },
    [refetchNotes],
  );

  const deleteNote = useCallback(
    async (id: number) => {
      await DocumentsService.deleteDocument(id);
      await Promise.all([refetchNotes(), refetchTrash()]);
    },
    [refetchNotes, refetchTrash],
  );

  const restoreNote = useCallback(
    async (id: number) => {
      await DocumentsService.restoreDocument(id);
      await Promise.all([refetchNotes(), refetchTrash()]);
    },
    [refetchNotes, refetchTrash],
  );

  const purgeNote = useCallback(
    async (id: number) => {
      await DocumentsService.purgeDocument(id);
      await refetchTrash();
    },
    [refetchTrash],
  );

  const shareNote = useCallback(
    async (id: number, targetUuid: string) => {
      await DocumentsService.addNoteToUser(id, targetUuid);
      await refetchNotes();
    },
    [refetchNotes],
  );

  const unshareNote = useCallback(
    async (id: number, targetUuid: string) => {
      await DocumentsService.removeNoteFromUser(id, targetUuid);
      await refetchNotes();
    },
    [refetchNotes],
  );

  // ---- folder / tag mutations ----
  const createFolder = useCallback(
    async (name: string, color: ColorKey = "primary", parentId: number | null = null) => {
      await DocumentsService.createFolder({ uuid, name, color, parentId });
      await foldersReq.refetch();
    },
    [uuid, foldersReq],
  );

  const deleteFolder = useCallback(
    async (id: number) => {
      await DocumentsService.deleteFolder(id);
      await Promise.all([foldersReq.refetch(), refetchNotes()]);
    },
    [foldersReq, refetchNotes],
  );

  const createTag = useCallback(
    async (label: string, color: ColorKey = "primary") => {
      await DocumentsService.createTag({ uuid, label, color });
      await tagsReq.refetch();
    },
    [uuid, tagsReq],
  );

  const deleteTag = useCallback(
    async (id: number) => {
      await DocumentsService.deleteTag(id);
      await Promise.all([tagsReq.refetch(), refetchNotes()]);
    },
    [tagsReq, refetchNotes],
  );

  return {
    uuid,
    notes,
    trash,
    folders,
    tags,
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
