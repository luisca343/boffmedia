import type { useTranslations } from "next-intl"
import type { DailyRewardItem } from "@boffmedia/shared"
import { ItemImage } from "@/lib/ItemImage"
import { getItemName } from "@/lib/intlUtils"
import type { ArTone } from "../_components/ui"

export interface RewardView {
  /** What the tile says. */
  label: string
  /** Which neon the tile wears. Keyed off the reward TYPE — the API has no
   *  per-day rarity, and inventing one would be fabricating data. */
  tone: ArTone
  /** The plinth artwork: a real sprite where one exists, else a pixel glyph. */
  art: React.ReactNode
}

/** `type` is a free string server-side; the generated union is stale, so widen it. */
const kind = (reward: Pick<DailyRewardItem, "type">) => String(reward.type).toLowerCase()

const TYPE_TONE: Record<string, ArTone> = {
  coins: "amber",
  money: "amber",
  currency: "amber",
  box: "violet",
  crate: "violet",
  item: "lime",
  pokemon: "cyan",
}

export const rewardTone = (reward: Pick<DailyRewardItem, "type">): ArTone =>
  TYPE_TONE[kind(reward)] ?? "cyan"

/** True when the reward is a *thing* (named, 1×) rather than a quantity. */
export const isNamedReward = (reward: Pick<DailyRewardItem, "type">) =>
  ["item", "crate", "box", "pokemon"].includes(kind(reward))

export function rewardView(
  reward: DailyRewardItem,
  /** The `arcade` translator. Reward keys are resolved at runtime, so it is passed in. */
  t: ReturnType<typeof useTranslations<"arcade">>,
  size = 36,
): RewardView {
  const type = kind(reward)
  const tone = rewardTone(reward)

  if (isNamedReward(reward) && reward.description) {
    return {
      label: getItemName(t, reward.description, type),
      tone,
      art: <ItemImage type={type} itemId={reward.description} size={size} />,
    }
  }

  // A quantity reward: coins/money have no sprite, so they get the pixel star.
  return {
    label: t(type === "money" ? "rewards.money" : "rewards.coins", { amount: reward.amount ?? 0 }),
    tone,
    art: <span className="font-ar-display">★</span>,
  }
}
