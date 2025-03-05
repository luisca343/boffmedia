import { useRotomRequest } from "../useRotomRequest";
import { documentsService } from "@/services/api/smartrotom/documentsService";
import { NewsStatusDto } from "@/types/dto/news-status-dto";

export function useUpdateNewsStatus() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(documentsService.updateNewsStatus)

  const updateNewsStatus = (statusData: NewsStatusDto) => {
    return documentsService.updateNewsStatus(statusData);
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

