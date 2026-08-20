"use client"

import type { IQuestReward } from "../_types"
import { itemLabel, spriteName } from "../_utils/items"
import { ItemSprite } from "./ui"

/**
 * One reward on the open letter: the item's real sprite, its name and how many
 * of it the encargo pays.
 *
 * [deferred] No rarity tier, colour, stars or shimmer: the quest API has no
 * rarity — a reward is `{ item, count }` — so it is left out rather than
 * guessed from the item id. `rarity` stays off this component's props until the
 * game exposes it. See docs/smartrotom/deferred/README.md.
 */
export function RewardCard({ reward }: { reward: IQuestReward }) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-ms-ink-1/25 bg-[rgba(255,240,200,.45)] p-3">
      <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-sm border-[1.5px] border-ms-ink-1/30 bg-gradient-to-br from-ms-gold-1 to-ms-gold-2">
        <ItemSprite name={spriteName(reward.item)} size={30} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold leading-tight text-ms-ink-1">{itemLabel(reward.item)}</div>
        {reward.count > 1 && (
          <div className="mt-0.5 font-ms-mono text-[11px] text-ms-ink-3">×{reward.count}</div>
        )}
      </div>
    </div>
  )
}
