import { useRotomRequest } from "../useRotomRequest";
import { usersService } from "@/services/api/smartrotom/usersService";

export function useGetUser(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(usersService.findOne, uuid)

  return {
    user: data,
    error,
    isLoading,
    refetch,
    setUser: setData
  }
}

