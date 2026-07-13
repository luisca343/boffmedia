import type { OpenLootBoxResponseDto } from "@boffmedia/shared"
import type { ResolvedBox } from "../../_utils/inventory"
import { rarityFromWeight, type ItemRarity } from "../../_utils/rarity"

export interface ReelTile {
  key: string
  id: string
  rarity: ItemRarity
  type?: string
  data?: string
  amount?: number
}

export interface Reel {
  tiles: ReelTile[]
  winningPosition: number
}

/**
 * The reel the server actually rolled. `spinnerItems` only carries `{id, weight,
 * isWinningItem}` on the wire, so the rarity/type/art of each face is joined back
 * from the box's own drop table — never invented.
 */
export function buildReel(result: OpenLootBoxResponseDto, box: ResolvedBox | undefined): Reel {
  const table = new Map((box?.items ?? []).map((i) => [i.id, i]))
  const spinner = result.spinnerItems ?? []

  const tiles: ReelTile[] = spinner.map((face, i) => {
    const config = table.get(face.id)
    return {
      key: `${face.id}-${i}`,
      id: face.id,
      rarity: (config?.rarity ?? rarityFromWeight(face.weight ?? 0)) as ItemRarity,
      type: config?.type,
      data: config?.data,
      amount: config?.amount,
    }
  })

  const declared = result.winningPosition
  const winningPosition =
    declared != null && declared >= 0 && declared < tiles.length
      ? declared
      : spinner.findIndex((face) => face.isWinningItem)

  return { tiles, winningPosition }
}
