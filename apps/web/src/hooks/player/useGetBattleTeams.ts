import { useRotomRequest } from "@/hooks/useRotomRequest"
import { WingullService } from "@/services/api/smartrotom/wingullService"
import { BattleTeamData } from "@/types/dto/battle-team.dto"

export function useGetBattleTeams(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(WingullService.getBattleTeams, uuid)

  return {
    battleTeamsData: data as BattleTeamData | undefined,
    error,
    isLoading,
    refetch,
    setBattleTeamsData: setData,
  }
}
