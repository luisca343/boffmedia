import { NPC } from "@/types/misiones";
import { useRotomRequest } from "../useRotomRequest";
import { misionesService } from "@/services/api/smartrotom/misionesService";

export function useUpdateNPCs() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(misionesService.updateNPCs)

  const updateNPCs = (npcs: NPC[]) => {
    return misionesService.updateNPCs(npcs);
  }

  return {
    updatedNPCs: data,
    error,
    isLoading,
    refetch,
    updateNPCs,
    setUpdatedNPCs: setData
  }
}

