import { useRotomRequest } from "../useRotomRequest";
import { usersService } from "@/services/api/smartrotom/usersService";

export function useRemoveUser() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(usersService.remove)

  const removeUser = (id: number) => {
    return usersService.remove(id);
  }

  return {
    removedUser: data,
    error,
    isLoading,
    refetch,
    removeUser,
    setRemovedUser: setData
  }
}

