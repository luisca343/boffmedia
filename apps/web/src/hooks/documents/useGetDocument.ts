import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";

export function useGetDocument(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.getDocument, id)

  return {
    document: data,
    error,
    isLoading,
    refetch,
    setDocument: setData
  }
}

