import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import { CreateDocumentDto } from "@/types/dto/create-document.dto";

export function useSaveNote() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.saveNote)

  const saveNote = (id: number, noteData: CreateDocumentDto) => {
    return DocumentsService.saveNote(id, noteData);
  }

  return {
    savedNote: data,
    error,
    isLoading,
    refetch,
    saveNote,
    setSavedNote: setData
  }
}

