
import { useMemo } from "react"
import { useRotomRequest } from "@/hooks/useRotomRequest"
import { AchievementService } from "@/services/api/smartrotom/achievementsService"

export function useGetAchievements(uuid: string) {
  // Memoize the params so the hook only refetches when uuid changes
  const params = useMemo(() => ({ uuid }), [uuid])
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AchievementService.getAchievements, params)

  return {
    achievements: data || [],
    error,
    isLoading,
    refetch,
    setAchievements: setData,
  }
}

