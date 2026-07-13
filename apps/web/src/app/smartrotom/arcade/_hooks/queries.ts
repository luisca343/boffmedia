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
import { ArcadeService } from "@/services/api/smartrotom/arcadeService"
import { useBoffSession } from "@/services/useBoffSession"

/** The SmartRotom uuid every arcade endpoint is keyed by. `null` until signed in. */
export function useArcadeUuid(): string | null {
  const { session } = useBoffSession()
  return session?.user?.smartRotomUser?.uuid ?? null
}

/**
 * `boffAPI` has two failure modes: network errors throw, HTTP errors resolve to
 * `{ success: false }`. Reading `.data` off an unchecked response is the silent-
 * failure pattern the audit flagged, so every query funnels through here and
 * turns a failed envelope into a thrown error React Query can see (§8).
 */
async function unwrap<T>(call: Promise<{ success: boolean; data?: T; message?: string }>): Promise<T> {
  const res = await call
  if (!res.success || res.data === undefined) {
    throw new Error(res.message || "La petición al arcade falló")
  }
  return res.data
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
    queryFn: () => unwrap<ArcadeStreak>(ArcadeService.getStreak(uuid!)),
    enabled: Boolean(uuid),
  })
}

/** The active banner: its name, its 7 days and what each day pays out. */
export function useRewardsBanner() {
  return useQuery({
    queryKey: arcadeKeys.banner(),
    queryFn: () => unwrap<DailyRewardsConfig>(ArcadeService.getRewardsBanner()),
    // The banner is a static config file server-side; it does not move.
    staleTime: 30 * 60_000,
  })
}

export function useArcadeInventory() {
  const uuid = useArcadeUuid()
  return useQuery({
    queryKey: arcadeKeys.inventory(uuid ?? ""),
    queryFn: () => unwrap<ArcadeInventoryResponse>(ArcadeService.getInventory(uuid!)),
    enabled: Boolean(uuid),
  })
}

export function useLootboxConfig() {
  return useQuery({
    queryKey: arcadeKeys.lootboxConfig(),
    queryFn: () => unwrap<LootboxConfigEntity>(ArcadeService.getLootboxConfig()),
    staleTime: 30 * 60_000,
  })
}

export function useClaimDailyReward() {
  const uuid = useArcadeUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => unwrap(ArcadeService.claimDailyReward({ uuid: uuid! })),
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
      unwrap<OpenLootBoxResponseDto>(ArcadeService.openLootbox({ uuid: uuid!, boxId })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: arcadeKeys.inventory(uuid ?? "") })
    },
  })
}

export function useClaimItems() {
  const uuid = useArcadeUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: ArcadeInventoryItem[]) =>
      unwrap(ArcadeService.claimItems({ uuid: uuid!, items })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: arcadeKeys.inventory(uuid ?? "") })
    },
  })
}
