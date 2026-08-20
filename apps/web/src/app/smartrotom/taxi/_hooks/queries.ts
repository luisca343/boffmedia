"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { Region, StarBankAccount, StarBankTransaction, TaxiStop } from "@boffmedia/shared"
import { rotomAuthedPOSTOrThrow, rotomGETOrThrow, wingullGETOrThrow } from "@/services/boffAPI"
import { getMcUserData } from "@/services/mcef/mcefApi"
import { POSITION_REFRESH_INTERVAL } from "../_utils/constants"
import type { Position, TaxiConfig, TripResult } from "../_types"

export const taxiKeys = {
  stops: ["taxi", "stops"] as const,
  regions: ["taxi", "regions"] as const,
  position: ["taxi", "position"] as const,
  config: ["taxi", "config"] as const,
  balance: (uuid?: string) => ["taxi", "balance", uuid] as const,
  accounts: (uuid?: string) => ["taxi", "accounts", uuid] as const,
}

/**
 * The fare model and the account fares are paid into.
 *
 * The account id is read rather than hardcoded: it is a seeded row, so its id is whatever
 * the database assigned. `0` in particular is the virtual system account and can never hold
 * a fare.
 */
export function useTaxiConfig() {
  return useQuery({
    queryKey: taxiKeys.config,
    queryFn: () => rotomGETOrThrow<TaxiConfig>("/taxi/config"),
    staleTime: Infinity,
  })
}

/**
 * The player's ledger — their StarBank accounts and the movements on them. The taxi's
 * whole travel history is derived from this (`_utils/trips.ts`).
 *
 * It is read **per account**, not through `GET /starbank/transactions/user/:uuid`. Two
 * defects in that endpoint make it unusable here, both verified against the live API:
 *
 * 1. It returns a *different* user's rows — asking for ProfesorFicus (account 23) came
 *    back with Luisca343's ledger (accounts 5/7). Trusting it would show one player
 *    another player's money.
 * 2. It never populates `isPayer`, even though the entity declares it — so there is no
 *    direction flag to read, and a debit would render as a credit.
 *
 * The account-scoped endpoint is correct, and the accounts call gives us the ids we need
 * to tell which side of a transfer we are on.
 */
export function useLedger(uuid?: string) {
  return useQuery({
    queryKey: taxiKeys.accounts(uuid),
    queryFn: async () => {
      const accounts = await rotomGETOrThrow<StarBankAccount[]>(`/starbank/accounts/${uuid}`)
      const accountIds = accounts.map((a) => a.id)

      const perAccount = await Promise.all(
        accountIds.map((id) =>
          rotomGETOrThrow<StarBankTransaction[]>(`/starbank/transactions/${id}?limit=100`),
        ),
      )

      // A transfer between two of the player's own accounts is returned by both, so the
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
    enabled: Boolean(uuid),
    staleTime: 15_000,
  })
}

/** The world's taxi stops. Static for a session — the server only changes them on restart. */
export function useStops() {
  return useQuery({
    queryKey: taxiKeys.stops,
    queryFn: async () => {
      const stops = await wingullGETOrThrow<TaxiStop[] | Record<string, TaxiStop>>("/taxi/stops")
      // The upstream game API has historically returned a map rather than an array.
      return (Array.isArray(stops) ? stops : Object.values(stops)) as TaxiStop[]
    },
    staleTime: Infinity,
  })
}

/**
 * The world's WorldGuard regions, used to name the zone each stop stands in. Purely
 * decorative: if the call fails the stops simply carry no region badge, so it never
 * blocks travel.
 */
export function useRegions() {
  return useQuery({
    queryKey: taxiKeys.regions,
    queryFn: () => wingullGETOrThrow<Region[]>("/regions"),
    staleTime: Infinity,
    retry: false,
  })
}

/**
 * Where the player is standing, from the Minecraft client bridge. Only resolves inside
 * MCEF — in a plain browser the bridge returns 0,0 and the map simply centres on spawn.
 */
export function usePlayerPosition() {
  const t = useTranslations("taxi.errors")
  return useQuery<Position>({
    queryKey: taxiKeys.position,
    queryFn: async () => {
      const res = await getMcUserData()
      if (res.status !== 200 || !res.data) throw new Error(t("noPlayerPosition"))
      return { x: Math.floor(res.data.x), z: Math.floor(res.data.z) }
    },
    refetchInterval: POSITION_REFRESH_INTERVAL,
    placeholderData: { x: 0, z: 0 },
    retry: false,
  })
}

export function useBalance(uuid?: string) {
  return useQuery({
    queryKey: taxiKeys.balance(uuid),
    queryFn: async () => (await rotomGETOrThrow<{ balance: number }>(`/starbank/balance/${uuid}`)).balance,
    enabled: Boolean(uuid),
    staleTime: 15_000,
  })
}

/**
 * Travel, then pay — one server-side call.
 *
 * Never transfer the fare here and *then* ask for the teleport: every ordinary
 * failure (logged out, stop deleted, no safe arrival) leaves the player charged and
 * standing where they were, with no refund path. `POST /smartrotom/taxi/trip`
 * teleports first and charges only on a confirmed arrival, so a failed trip costs
 * nothing.
 *
 * The price is not sent: the server recomputes it from the player's live position, which is
 * also what stops a crafted request from naming its own fare. What the page shows is an
 * estimate from the same formula.
 */
export function useTeleport(uuid?: string) {
  const qc = useQueryClient()
  const t = useTranslations("taxi.errors")
  return useMutation({
    mutationFn: async ({ stop }: { stop: TaxiStop }) => {
      if (!uuid) throw new Error(t("loginRequired"))

      await rotomAuthedPOSTOrThrow<TripResult>("/taxi/trip", { stopId: stop.id })
      return stop
    },
    onSuccess: () => {
      // The fare moved money and the trip is now in the ledger: both the balance and
      // the derived passport/history are stale.
      void qc.invalidateQueries({ queryKey: taxiKeys.balance(uuid) })
      void qc.invalidateQueries({ queryKey: taxiKeys.accounts(uuid) })
      void qc.invalidateQueries({ queryKey: taxiKeys.position })
    },
  })
}
