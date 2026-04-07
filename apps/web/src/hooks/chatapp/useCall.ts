import { useRotomRequest } from "../useRotomRequest";
import { ChatAppService } from "@/services/api/smartrotom/chatAppService";

export function useCall() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(ChatAppService.initiateCall)

  const call = (chatId: number, uuid: string) => {
    return ChatAppService.initiateCall(chatId, {chatId, uuid});
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

