import type { NPC as SharedNPC, Quest } from "@boffmedia/shared"
import type { IDialogue, IQuestObjective, IQuestReward, QuestData } from "@/types/misiones"

export type { IDialogue, IQuestObjective, IQuestReward, QuestData }

/**
 * A quest giver. Narrower than the quest API's `NPC` because the board builds it
 * from `dialogs[].npcLocations` — `id`/`text`/`questId`/`requirements` have no
 * source there, and nothing rendered them. `skin`/`dialogId` are Minecraft-side and
 * absent from the DTO; the rest is picked from it so a rename upstream breaks here.
 */
export interface NPC extends Pick<SharedNPC, "name"> {
  skin: string
  dialogId: number
}

/**
 * The five wax seals the board knows about. Derived from the DTO's `Quest.status`
 * so a new server status fails the build here: `NOT_STARTED` has no seal —
 * `normalizeStatus` resolves it against the quest's own requirements
 * (see `_utils/status.ts`).
 */
export type SealStatus = Exclude<`${Quest.status}`, "NOT_STARTED">

/* The remaining types in this file are board-only view models with no server DTO:
   the API exposes no region/atlas entity, no aggregated reward inventory and no
   quest-chain shape — all three are derived client-side (see the doc comments). */

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
