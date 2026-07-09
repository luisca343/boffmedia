import { useCallback, useEffect, useState } from "react"
import { ProfileService } from "@/services/api/boffmedia/profileService"
import type { UserActivityItemEntity, UserTrophiesEntity } from "@boffmedia/shared"

/** Fetches a user's trophy case; no-ops until a valid userId is available. */
export function useUserTrophies(userId?: number | null) {
  const [data, setData] = useState<UserTrophiesEntity | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!!userId)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId || userId <= 0) return
    setIsLoading(true)
    try {
      const res = await ProfileService.getUserTrophies(userId)
      if (res.error) setError(res.error)
      else setData(res.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { trophies: data, isLoading, error, refetch: fetchData }
}

/** Fetches a user's activity timeline; no-ops until a valid userId is available. */
export function useUserActivity(userId?: number | null, limit?: number) {
  const [data, setData] = useState<UserActivityItemEntity[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(!!userId)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId || userId <= 0) return
    setIsLoading(true)
    try {
      const res = await ProfileService.getUserActivity(userId, limit)
      if (res.error) setError(res.error)
      else setData(res.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { activity: data, isLoading, error, refetch: fetchData }
}
