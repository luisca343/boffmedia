import { useRotomRequest } from "../useRotomRequest";
import { MisionesService } from "@/services/api/smartrotom/misionesService";

export function useGetNpcCatalog() {
  const { data, error, isLoading, refetch } = useRotomRequest(MisionesService.getNpcCatalog);

  return {
    npcCatalog: data ?? {},
    error,
    isLoading,
    refetch,
  };
}
