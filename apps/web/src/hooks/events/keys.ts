import { queryKey } from "@/lib/query/keys"
import type { EventFilters } from "@/services/api/boffmedia/eventsService"

/**
 * Query keys for the events domain. Shape is `[domain, resource, ...ids,
 * params?]` — see `lib/query/keys.ts` for the convention and for why the params
 * object is normalised rather than passed through.
 */
export const eventKeys = {
  all: () => ["events"] as const,
  list: (filters?: EventFilters) => queryKey("events", "list", [], filters),
  detail: (id: number) => queryKey("events", "detail", [id]),
  games: () => queryKey("events", "games"),
  game: (id: number) => queryKey("events", "game", [id]),
  achievements: () => queryKey("events", "achievements"),
  eventAchievements: (eventId: number) => queryKey("events", "eventAchievements", [eventId]),
  teams: () => queryKey("events", "teams"),
  leaderboards: () => queryKey("events", "leaderboards"),
  leaderboard: (eventId: number) => queryKey("events", "leaderboard", [eventId]),
  participants: (eventId: number) => queryKey("events", "participants", [eventId]),
} as const
