import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";

export function useGetNotes(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.getNotes, uuid)

  return {
    notes: data,
    error,
    isLoading,
    refetch,
    setNotes: setData
  }
}

