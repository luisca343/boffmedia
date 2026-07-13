import type { IQuestObjective, IQuestReward, QuestData, SatchelItem } from "../_types"
import { normalizeStatus } from "./status"

/**
 * Rewards arrive as a namespaced Minecraft id and a count —
 * `{ item: "pixelmon:poke_ball", count: 5 }`. There is no display name and no
 * rarity in the API: the name is titled from the id, and rarity is deferred
 * (see `_components/RewardCard`).
 */
export const spriteName = (item: string) => item.split(":").pop() ?? item

export function itemLabel(item: string) {
  return spriteName(item)
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * The sprite an objective shows. Kept byte-for-byte compatible with the lookup
 * the old quest log used — objective names are free text from the quest file
 * ("Poke ball: consigue 5"), and only the leading token resolves to an item.
 */
export const objectiveSprite = (objective: Pick<IQuestObjective, "name">) =>
  objective.name.split(":")[0].toLowerCase().replace(" ", "_")

/**
 * La Mochila's ledger: every item any quest rewards, counted only where the
 * quest is actually COMPLETED. An item nobody has earned yet still shows — as
 * an unclaimed slot, never as a fake count.
 */
export function buildSatchel(quests: QuestData[]): SatchelItem[] {
  const ledger = new Map<string, SatchelItem>()

  for (const quest of quests) {
    const earned = normalizeStatus(quest) === "COMPLETED"
    for (const reward of quest.rewards ?? []) {
      const entry = ledger.get(reward.item) ?? {
        item: reward.item,
        name: itemLabel(reward.item),
        sprite: spriteName(reward.item),
        count: 0,
        owned: false,
        sources: 0,
      }
      entry.count += earned ? reward.count : 0
      entry.owned = entry.owned || earned
      entry.sources += 1
      ledger.set(reward.item, entry)
    }
  }

  return [...ledger.values()].sort((a, b) => {
    if (a.owned !== b.owned) return a.owned ? -1 : 1
    return b.count - a.count || a.name.localeCompare(b.name)
  })
}

export const rewardKey = (reward: IQuestReward) => reward.item
