import { useRotomRequest } from "../useRotomRequest";
import { usersService } from "@/services/api/smartrotom/usersService";
import { UpdateUserDto } from "@/types/dto/update-user.dto";

export function useUpdateUser() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(usersService.update)

  const updateUser = (id: number, userData: UpdateUserDto) => {
    return usersService.update(id, userData);
  }

  return {
    updatedUser: data,
    error,
    isLoading,
    refetch,
    updateUser,
    setUpdatedUser: setData
  }
}

