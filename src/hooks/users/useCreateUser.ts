import { useRotomRequest } from "../useRotomRequest";
import { usersService } from "@/services/api/smartrotom/usersService";
import { CreateSmartrotomUserDto } from "@/types/dto/create-user.dto";

export function useCreateUser() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(usersService.create)

  const createUser = (userData: CreateSmartrotomUserDto) => {
    return usersService.create(userData);
  }

  return {
    createdUser: data,
    error,
    isLoading,
    refetch,
    createUser,
    setCreatedUser: setData
  }
}

