import { useRotomRequest } from "@/hooks/useRotomRequest"
import { battleService, type BattleConfig } from "@/services/api/smartrotom/battleService"

export function useGetBattleConfig(npcConfigName: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest<BattleConfig>(
    battleService.getBattleConfig,
    npcConfigName,
  )

  return {
    battleConfig: data,
    error,
    isLoading,
    refetch,
    setBattleConfig: setData,
  }
}

