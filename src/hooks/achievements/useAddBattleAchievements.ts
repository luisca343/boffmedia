import { useRotomRequest } from "@/hooks/useRotomRequest"
import { achievementService } from "@/services/api/smartrotom/achievementsService"
import { SuccessResponse } from "@/types"
import { BattleAchievementDto } from "@/types/dto/battle-achievement-dto"

export function useAddBattleAchievement() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(achievementService.addBattleAchievement)

  const addBattleAchievement = (battleAchievement: BattleAchievementDto) => {
    return achievementService.addBattleAchievement(battleAchievement)
  }

  return {
    result: data,
    error,
    isLoading,
    refetch,
    addBattleAchievement,
    setResult: setData,
  }
}

