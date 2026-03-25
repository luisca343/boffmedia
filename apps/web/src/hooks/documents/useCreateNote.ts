import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import { CreateDocumentDtoWithUuid } from "@/types/dto/create-document.dto";

export function useCreateNote() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.createNote)

  const createNote = (noteData: CreateDocumentDtoWithUuid) => {
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

