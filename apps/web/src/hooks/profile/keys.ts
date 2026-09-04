import { queryKey } from "@/lib/query/keys"

/**
 * Query keys for the profile domain. Shape is `[domain, resource, ...ids,
 * params?]` — see `lib/query/keys.ts`.
 */
export const profileKeys = {
  all: () => ["profile"] as const,
  trophies: (userId?: number | null) => queryKey("profile", "trophies", [userId ?? null]),
  activity: (userId?: number | null, limit?: number) =>
    queryKey("profile", "activity", [userId ?? null], { limit }),
  byHandle: (handle: string) => queryKey("profile", "byHandle", [handle]),
} as const
