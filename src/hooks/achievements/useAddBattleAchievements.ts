import { useRotomRequest } from "@/hooks/useRotomRequest"
import { achievementService, BattleAchievementDto } from "@/services/api/smartrotom/achievementsService"

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

