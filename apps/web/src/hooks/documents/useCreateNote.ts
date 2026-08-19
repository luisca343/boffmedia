import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import type { CreateDocumentDto } from "@boffmedia/shared";

export function useCreateNote() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.createNote)

  const createNote = (noteData: CreateDocumentDto) => {
    return DocumentsService.createNote(noteData);
  }

  return {
    createdNote: data,
    error,
    isLoading,
    refetch,
    createNote,
    setCreatedNote: setData
  }
}

