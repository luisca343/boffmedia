import type { IDialogue, IQuestObjective, IQuestReward, NPC, QuestData } from "@/types/misiones"

export type { IDialogue, IQuestObjective, IQuestReward, NPC, QuestData }

/**
 * The five wax seals the board knows about. The API's `QuestStatus` also has
 * `NOT_STARTED`, which has no seal — `normalizeStatus` resolves it against the
 * quest's own requirements (see `_utils/status.ts`).
 */
export type SealStatus = "ACTIVE" | "AVAILABLE" | "COMPLETED" | "FAILED" | "LOCKED"

/**
 * A "reino" on the board. Derived from the API's `categories` map
 * (`{ [name]: questId[] }`) — the game has no region entity, so the category
 * name IS the region. Everything decorative about it (glyph, terrain, its place
 * on the atlas) is deterministic from that name, never stored.
 */
export interface Region {
  id: string
  name: string
  questIds: number[]
  glyph: string
  terrain: TerrainKind
  x: number
  y: number
}

export type TerrainKind = "town" | "forest" | "city" | "mountain" | "ruins" | "island"

/** An item aggregated across every quest that rewards it (La Mochila). */
export interface SatchelItem {
  /** Namespaced Minecraft id, e.g. `pixelmon:poke_ball`. */
  item: string
  name: string
  sprite: string
  /** Total count across COMPLETED quests — 0 while still unearned. */
  count: number
  owned: boolean
  /** How many quests hand this item out. */
  sources: number
}

/** One link of the rope: a quest and where it sits relative to the open one. */
export interface ChainLink {
  quest: QuestData
  rel: "prev" | "self" | "next"
}
