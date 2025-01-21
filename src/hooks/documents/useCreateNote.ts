import { useRotomRequest } from "../useRotomRequest";
import { documentsService } from "@/services/api/smartrotom/documentsService";
import { CreateDocumentDtoWithUuid } from "@/types/dto/create-document.dto";

export function useCreateNote() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(documentsService.createNote)

  const createNote = (noteData: CreateDocumentDtoWithUuid) => {
    return documentsService.createNote(noteData);
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

