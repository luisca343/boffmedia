"use client"

import { useQuery } from "@tanstack/react-query"
import type {
  PasaporteLogroEntity,
  PasaporteProfileEntity,
  PasaporteSeasonEntity,
  PokemonW,
  Replay,
  StarBankAccount,
  StarBankTransaction,
  UserAchievement,
} from "@boffmedia/shared"
import { PasaporteService } from "@/services/api/smartrotom/pasaporteService"
import { type MinecraftStats } from "@/services/api/smartrotom/playerService"
import { rotomGETOrThrow, rotomPOSTOrThrow, wingullPOSTOrThrow } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession"

/** The SmartRotom uuid every passport route is keyed by. `null` until signed in. */
export function usePasaporteUuid(): string | null {
  const { session } = useBoffSession()
  return session?.user?.smartRotomUser?.uuid ?? null
}

export const pasaporteKeys = {
  profile: (uuid: string) => ["pasaporte", "profile", uuid] as const,
  stats: (uuid: string) => ["pasaporte", "stats", uuid] as const,
  team: (uuid: string) => ["pasaporte", "team", uuid] as const,
  achievements: (uuid: string) => ["pasaporte", "achievements", uuid] as const,
  logros: (uuid: string) => ["pasaporte", "logros", uuid] as const,
  season: (uuid: string) => ["pasaporte", "season", uuid] as const,
  ledger: (uuid: string) => ["pasaporte", "ledger", uuid] as const,
  replay: (uuid: string, replayId: number) => ["pasaporte", "replay", uuid, replayId] as const,
}

export function usePassportProfile(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.profile(uuid ?? ""),
    queryFn: () => PasaporteService.getProfile(uuid!),
    enabled: !!uuid,
  })
}

/** The raw Minecraft stats blob. Keys are sparse — read it only through `_utils/stats.ts`. */
export function usePlayerStats(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.stats(uuid ?? ""),
    queryFn: () => rotomPOSTOrThrow<MinecraftStats>("/player/stats", { uuid: uuid! }),
    enabled: !!uuid,
  })
}

export function usePlayerTeam(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.team(uuid ?? ""),
    queryFn: () => wingullPOSTOrThrow<PokemonW[]>("/team", { uuid: uuid! }),
    enabled: !!uuid,
  })
}

/**
 * The gym/league badges. One list, read three times: Medallas shows the gyms,
 * Competiciones the leagues and the Frente de Batalla, and each badge page inks one row
 * of it. `completed` is a NUMBER (0/1), not a boolean — check truthiness, never `=== true`.
 */
export function useAchievements(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.achievements(uuid ?? ""),
    queryFn: () => rotomPOSTOrThrow<UserAchievement[]>("/achievement/get-achievements", { uuid: uuid! }),
    enabled: !!uuid,
  })
}

export function useLogros(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.logros(uuid ?? ""),
    queryFn: () => PasaporteService.getLogros(uuid!),
    enabled: !!uuid,
  })
}

export function useSeason(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.season(uuid ?? ""),
    queryFn: () => PasaporteService.getSeason(uuid!),
    enabled: !!uuid,
  })
}

/**
 * The trainer's StarBank ledger — the Bitácora's raw material, since there is no
 * "places visited" table and a taxi trip IS the transfer that paid for it.
 *
 * Read PER ACCOUNT, not through `GET /starbank/transactions/user/:uuid`. That endpoint has
 * two defects verified against the live API: it answers with a *different* user's rows, and
 * it never populates `isPayer` even though the entity declares it. This is the same call the
 * Taxi makes, for the same reasons (`taxi/_hooks/queries.ts`).
 */
export function useLedger(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.ledger(uuid ?? ""),
    queryFn: async () => {
      const accounts = await rotomGETOrThrow<StarBankAccount[]>(`/starbank/accounts/${uuid}`)
      const accountIds = accounts.map((a) => a.id)

      const perAccount = await Promise.all(
        accountIds.map((id) =>
          rotomGETOrThrow<StarBankTransaction[]>(`/starbank/transactions/${id}?limit=100`),
        ),
      )

      // A transfer between two of the trainer's own accounts comes back from both, so the
      // rows are keyed and de-duplicated before being merged into one statement.
      const seen = new Set<string>()
      const transactions = perAccount
        .flat()
        .filter((tx) => {
          const key = `${tx.date}|${tx.from}|${tx.to}|${tx.amount}|${tx.reason}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return { accountIds, transactions }
    },
    enabled: !!uuid,
    staleTime: 15_000,
  })
}

/**
 * A battle replay. Disabled until the modal actually opens — a passport lists dozens of
 * battles and none of their replays are worth fetching until one is asked for.
 */
export function useReplay(uuid?: string | null, replayId?: number | null) {
  return useQuery({
    queryKey: pasaporteKeys.replay(uuid ?? "", replayId ?? 0),
    queryFn: () => rotomPOSTOrThrow<Replay>("/achievement/get-replay", { uuid: uuid!, replayId: replayId! }),
    enabled: !!uuid && !!replayId,
    staleTime: Infinity,
  })
}
