import { useRotomRequest } from "../useRotomRequest";
import { documentsService } from "@/services/api/smartrotom/documentsService";

export function useGetNotes(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(documentsService.getNotes, uuid)

  return {
    notes: data,
    error,
    isLoading,
    refetch,
    setNotes: setData
  }
}

