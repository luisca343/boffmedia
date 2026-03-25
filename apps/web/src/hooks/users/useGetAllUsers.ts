import { useRotomRequest } from "../useRotomRequest";
import { UsersService } from "@/services/api/smartrotom/usersService";

export function useGetAllUsers() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(UsersService.findAll)

  return {
    users: data,
    error,
    isLoading,
    refetch,
    setUsers: setData
  }
}

