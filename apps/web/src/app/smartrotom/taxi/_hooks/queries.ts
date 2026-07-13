"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Region, StarBankAccount, StarBankTransaction, TaxiStop } from "@boffmedia/shared"
import { StarbankService } from "@/services/api/smartrotom/starbankService"
import { WingullService } from "@/services/api/smartrotom/wingullService"
import { rotomGETOrThrow, wingullGETOrThrow } from "@/services/boffAPI"
import { getMcUserData } from "@/services/mcef/mcefApi"
import { POSITION_REFRESH_INTERVAL, TAXI_SERVICE_ACCOUNT } from "../_utils/constants"
import { TRIP_CONCEPT_PREFIX } from "../_utils/trips"
import type { Position } from "../_types"

export const taxiKeys = {
  stops: ["taxi", "stops"] as const,
  regions: ["taxi", "regions"] as const,
  position: ["taxi", "position"] as const,
  balance: (uuid?: string) => ["taxi", "balance", uuid] as const,
  accounts: (uuid?: string) => ["taxi", "accounts", uuid] as const,
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
  return useQuery<Position>({
    queryKey: taxiKeys.position,
    queryFn: async () => {
      const res = await getMcUserData()
      if (res.status !== 200 || !res.data) throw new Error("Sin posición del jugador")
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
 * Pay, then teleport. The order matters and is not reversible: the fare is transferred
 * first, and only a settled payment teleports the player. If the transfer fails nothing
 * moves; if the teleport fails after payment we surface it loudly rather than pretend
 * the trip happened.
 */
export function useTeleport(uuid?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ stop, price }: { stop: TaxiStop; price: number }) => {
      if (!uuid) throw new Error("Necesitas iniciar sesión para viajar")

      const payment = await StarbankService.transferFromMain({
        uuid,
        to: TAXI_SERVICE_ACCOUNT,
        amount: price,
        concept: `${TRIP_CONCEPT_PREFIX}${stop.id}`,
      })
      if (!payment.success) throw new Error("No se pudo cobrar el viaje")

      const trip = await WingullService.teleportPlayer({ id: stop.id, uuid })
      if (!trip.success) throw new Error("Se cobró el viaje pero el teletransporte falló. Contacta con soporte.")

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
