import { useRotomRequest } from "../useRotomRequest";
import { usersService } from "@/services/api/smartrotom/usersService";
import { CreateSmartrotomUserDto } from "@/types/dto/create-user.dto";

export function useInitializeUser() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(usersService.initialize)

  const initializeUser = (userData: CreateSmartrotomUserDto) => {
    return usersService.initialize(userData);
  }

  return {
    initializedData: data,
    error,
    isLoading,
    refetch,
    initializeUser,
    setInitializedData: setData
  }
}

