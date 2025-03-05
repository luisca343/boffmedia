import { useRotomRequest } from "../useRotomRequest";
import { usersService } from "@/services/api/smartrotom/usersService";
import { CreateSmartrotomUserDto } from "@/types/dto/create-user.dto";

export function useFindUser() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(usersService.findUser)

  const findUser = (userData: CreateSmartrotomUserDto) => {
    return usersService.findUser(userData);
  }

  return {
    foundUser: data,
    error,
    isLoading,
    refetch,
    findUser,
    setFoundUser: setData
  }
}

