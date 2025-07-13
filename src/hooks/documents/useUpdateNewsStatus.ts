import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import { NewsStatusDto } from "@/types/dto/news-status-dto";

export function useUpdateNewsStatus() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.updateNewsStatus)

  const updateNewsStatus = (statusData: NewsStatusDto) => {
    return DocumentsService.updateNewsStatus(statusData);
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

