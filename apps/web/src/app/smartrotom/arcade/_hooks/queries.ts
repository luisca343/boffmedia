"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  ArcadeInventoryItem,
  ArcadeInventoryResponse,
  ArcadeStreak,
  DailyRewardsConfig,
  LootboxConfigEntity,
  OpenLootBoxResponseDto,
} from "@boffmedia/shared"
import { rotomGETOrThrow, rotomPOSTOrThrow } from "@/services/boffAPI"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { darCaja } from "@/services/mcef/mcefApi"

/** The SmartRotom uuid every arcade endpoint is keyed by. `null` until signed in. */
export function useArcadeUuid(): string | null {
  return useRotomUuid()
}

export const arcadeKeys = {
  streak: (uuid: string) => ["arcade", "streak", uuid] as const,
  banner: () => ["arcade", "banner"] as const,
  inventory: (uuid: string) => ["arcade", "inventory", uuid] as const,
  lootboxConfig: () => ["arcade", "lootbox-config"] as const,
}

export function useArcadeStreak() {
  const uuid = useArcadeUuid()
  return useQuery({
    queryKey: arcadeKeys.streak(uuid ?? ""),
    queryFn: () => rotomGETOrThrow<ArcadeStreak>(`/arcade/streak/${uuid}`),
    enabled: Boolean(uuid),
  })
}

/** The active banner: its name, its 7 days and what each day pays out. */
export function useRewardsBanner() {
  return useQuery({
    queryKey: arcadeKeys.banner(),
    queryFn: () => rotomGETOrThrow<DailyRewardsConfig>("/arcade/banner"),
    // The banner is a static config file server-side; it does not move.
    staleTime: 30 * 60_000,
  })
}

export function useArcadeInventory() {
  const uuid = useArcadeUuid()
  return useQuery({
    queryKey: arcadeKeys.inventory(uuid ?? ""),
    queryFn: () => rotomGETOrThrow<ArcadeInventoryResponse>(`/arcade/inventory/${uuid}`),
    enabled: Boolean(uuid),
  })
}

export function useLootboxConfig() {
  return useQuery({
    queryKey: arcadeKeys.lootboxConfig(),
    queryFn: () => rotomGETOrThrow<LootboxConfigEntity>("/arcade/lootbox/config"),
    staleTime: 30 * 60_000,
  })
}

export function useClaimDailyReward() {
  const uuid = useArcadeUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      rotomPOSTOrThrow<{ streak: ArcadeStreak; reward: any; inventoryItems?: ArcadeInventoryItem[] }>(
        "/arcade/streak/claim",
        { uuid: uuid! },
      ),
    onSuccess: () => {
      // A claim moves the streak AND can drop a box into the inventory.
      qc.invalidateQueries({ queryKey: arcadeKeys.streak(uuid ?? "") })
      qc.invalidateQueries({ queryKey: arcadeKeys.inventory(uuid ?? "") })
    },
  })
}

export function useOpenLootbox() {
  const uuid = useArcadeUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (boxId: string) =>
      rotomPOSTOrThrow<OpenLootBoxResponseDto>("/arcade/lootbox/open", { uuid: uuid!, boxId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: arcadeKeys.inventory(uuid ?? "") })
    },
  })
}

export function useClaimItems() {
  const uuid = useArcadeUuid()
  const qc = useQueryClient()
  return useMutation({
    // Delivery goes through MCEF: darCaja routes the ids to the mod, which asks the
    // backend what they are and gives them. Page never names a reward; in-game only.
    mutationFn: async (items: ArcadeInventoryItem[]) => {
      const res = await darCaja("arcade", items.map((i) => i.id))
      if (res.error || res.data?.status === "error") {
        throw new Error(res.error ?? "delivery failed")
      }
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: arcadeKeys.inventory(uuid ?? "") })
    },
  })
}
