import { useRotomRequest } from "../useRotomRequest";
import { appsService } from "@/services/api/smartrotom/appsService";
import { CreateAppDto } from "@/types/dto/create-app.dto";

export function useCreateApp() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.create)

  const createApp = (createAppDto: CreateAppDto) => {
    return appsService.create(createAppDto);
  }

  return {
    createdApp: data,
    error,
    isLoading,
    refetch,
    createApp,
    setCreatedApp: setData
  }
}

