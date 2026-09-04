"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ProfileService } from "@/services/api/boffmedia/profileService"
import { queryErrorText } from "@/lib/query/errorText"
import { profileKeys } from "./keys"

/** A valid user id — the `enabled` gate for both profile queries. */
const isUserId = (userId?: number | null): userId is number => !!userId && userId > 0

/**
 * Fetches a user's trophy case; idle until a valid userId is available.
 *
 * `/perfil` and `/u/[handle]` both mount this next to `useUserActivity`, and the
 * profile tabs re-mount the view — deduplication and the shared cache are the
 * whole point of the conversion here.
 */
export function useUserTrophies(userId?: number | null) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: profileKeys.trophies(userId),
    queryFn: () => orThrow(ProfileService.getUserTrophies(userId as number)),
    enabled: isUserId(userId),
  })

  return {
    trophies: data ?? null,
    // Matches the old hook: no id means nothing is loading, not "loading forever".
    isLoading: isLoading && isUserId(userId),
    error: queryErrorText(error),
    refetch,
  }
}

/** Fetches a user's activity timeline; idle until a valid userId is available. */
export function useUserActivity(userId?: number | null, limit?: number) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: profileKeys.activity(userId, limit),
    queryFn: () => orThrow(ProfileService.getUserActivity(userId as number, limit)),
    enabled: isUserId(userId),
  })

  return {
    activity: data ?? [],
    isLoading: isLoading && isUserId(userId),
    error: queryErrorText(error),
    refetch,
  }
}
