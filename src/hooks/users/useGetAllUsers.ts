import { useRotomRequest } from "../useRotomRequest";
import { usersService } from "@/services/api/smartrotom/usersService";

export function useGetAllUsers() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(usersService.findAll)

  return {
    users: data,
    error,
    isLoading,
    refetch,
    setUsers: setData
  }
}

