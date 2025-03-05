import { useRotomRequest } from "../useRotomRequest";
import { appsService } from "@/services/api/smartrotom/appsService";
import { UpdateAppDto } from "@/types/dto/update-app.dto";

export function useUpdateApp() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.update)

  const updateApp = (id: number, updateAppDto: UpdateAppDto) => {
    return appsService.update(id, updateAppDto);
  }

  return {
    updatedApp: data,
    error,
    isLoading,
    refetch,
    updateApp,
    setUpdatedApp: setData
  }
}

