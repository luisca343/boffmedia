import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import { NewsStatusDto } from "@boffmedia/shared";

export function useUpdateNewsStatus() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.updateNewsStatus)

  const updateNewsStatus = (statusData: NewsStatusDto, token: string) => {
    return DocumentsService.updateNewsStatus(statusData, token);
  }

  return {
    updatedStatus: data,
    error,
    isLoading,
    refetch,
    updateNewsStatus,
    setUpdatedStatus: setData
  }
}

