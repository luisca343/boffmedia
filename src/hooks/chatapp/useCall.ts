import { useRotomRequest } from "../useRotomRequest";
import { chatAppService } from "@/services/api/smartrotom/chatAppService";

export function useCall() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(chatAppService.call)

  const call = (chatId: number, uuid: string) => {
    return chatAppService.call(chatId, uuid);
  }

  return {
    callData: data,
    error,
    isLoading,
    refetch,
    call,
    setCallData: setData
  }
}

