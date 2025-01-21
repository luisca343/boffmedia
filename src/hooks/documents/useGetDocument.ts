import { useRotomRequest } from "../useRotomRequest";
import { documentsService } from "@/services/api/smartrotom/documentsService";

export function useGetDocument(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(documentsService.getDocument, id)

  return {
    document: data,
    error,
    isLoading,
    refetch,
    setDocument: setData
  }
}

