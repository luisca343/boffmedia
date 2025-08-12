import { NPC } from "@/types/misiones";
import { useRotomRequest } from "../useRotomRequest";
import { MisionesService } from "@/services/api/smartrotom/misionesService";

export function useUpdateNPCs() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MisionesService.updateNPCs)

  const updateNPCs = (npcs: NPC[]) => {
    return MisionesService.updateNPCs(npcs);
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

