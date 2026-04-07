import { useMemo } from "react";
import { useRotomRequest } from "../useRotomRequest";
import { MinaService } from "@/services/api/smartrotom/minaService";

export function useGetUnclaimed(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MinaService.getUnclaimedRewards, uuid)
  
  const getBoxes = useMemo(() => {
    return Math.ceil((data?.length || 0) / 27);
  }, [data?.length])

  return {
    unclaimed: data,
    error,
    isLoading,
    refetch,
    setUnclaimed: setData,
    boxes: getBoxes
  }
}

