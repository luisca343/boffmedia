"use client"

import { useQuery } from "@tanstack/react-query"
import type {
  PasaporteLogroEntity,
  PasaporteProfileEntity,
  PasaporteSeasonEntity,
  PokemonW,
  Replay,
  UserAchievement,
} from "@boffmedia/shared"
import { AchievementService } from "@/services/api/smartrotom/achievementsService"
import { PasaporteService } from "@/services/api/smartrotom/pasaporteService"
import { PlayerService, type MinecraftStats } from "@/services/api/smartrotom/playerService"
import { StarbankService } from "@/services/api/smartrotom/starbankService"
import { WingullService } from "@/services/api/smartrotom/wingullService"
import { useBoffSession } from "@/services/useBoffSession"

/**
 * `boffAPI` has two failure modes: network errors throw, HTTP errors resolve to
 * `{ success: false }` (SMARTROTOM_V3 §8). Reading `.data` off an unchecked response is
 * the silent-failure pattern the audit flagged, so every read funnels through here and
 * turns a failed envelope into a thrown error react-query can see, retry and surface.
 */
async function unwrap<T>(
  promise: Promise<{ success: boolean; data?: T; message?: string }>,
  what: string,
): Promise<T> {
  const res = await promise
  if (!res.success || res.data === undefined) throw new Error(res.message || `No se pudo cargar ${what}`)
  return res.data
}

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
    queryFn: () => unwrap<PasaporteProfileEntity>(PasaporteService.getProfile(uuid!), "el pasaporte"),
    enabled: !!uuid,
  })
}

/** The raw Minecraft stats blob. Keys are sparse — read it only through `_utils/stats.ts`. */
export function usePlayerStats(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.stats(uuid ?? ""),
    queryFn: () => unwrap<MinecraftStats>(PlayerService.getStats(uuid!), "tus estadísticas"),
    enabled: !!uuid,
  })
}

export function usePlayerTeam(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.team(uuid ?? ""),
    queryFn: () => unwrap<PokemonW[]>(WingullService.getTeam(uuid!), "tu equipo"),
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
    queryFn: () => unwrap<UserAchievement[]>(AchievementService.getAchievements({ uuid: uuid! }), "tus medallas"),
    enabled: !!uuid,
  })
}

export function useLogros(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.logros(uuid ?? ""),
    queryFn: () => unwrap<PasaporteLogroEntity[]>(PasaporteService.getLogros(uuid!), "tus logros"),
    enabled: !!uuid,
  })
}

export function useSeason(uuid?: string | null) {
  return useQuery({
    queryKey: pasaporteKeys.season(uuid ?? ""),
    queryFn: () => unwrap<PasaporteSeasonEntity>(PasaporteService.getSeason(uuid!), "la temporada"),
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
      const accounts = await unwrap(StarbankService.getUserAccounts(uuid!), "tus cuentas")
      const accountIds = accounts.map((a) => a.id)

      const perAccount = await Promise.all(
        accountIds.map((id) => unwrap(StarbankService.getAccountTransactions(id, 100), "tus movimientos")),
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
    queryFn: () => unwrap<Replay>(AchievementService.getReplay(uuid!, replayId!), "el combate"),
    enabled: !!uuid && !!replayId,
    staleTime: Infinity,
  })
}
