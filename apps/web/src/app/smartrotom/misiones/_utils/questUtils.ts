import { QuestData, NPC } from "@/types/misiones"
import { Region } from "../_types/board"

export const QUEST_TYPE_LABELS: Record<number, string> = {
  0: "Principal", 1: "Secundaria", 2: "Diaria",
  3: "Gimnasio", 4: "Rival", 5: "Endgame",
}

const QUEST_TYPE_KEYS: Record<number, string> = {
  0: "type_main", 1: "type_side", 2: "type_daily",
  3: "type_gym", 4: "type_rival", 5: "type_endgame",
}

export function getQuestTypeKey(type: number): string {
  return QUEST_TYPE_KEYS[type] ?? "type_mission"
}

export const STATUS_ORDER: Record<string, number> = {
  ACTIVE: 1, AVAILABLE: 2, COMPLETED: 3, FAILED: 4, LOCKED: 5, NOT_STARTED: 6,
}

export function getQuestTypeLabel(type: number): string {
  return QUEST_TYPE_LABELS[type] ?? "Misión"
}

export function formatItemName(item: string): string {
  const parts = item.split(":")
  const raw = parts[parts.length - 1] ?? item
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function tiltFor(id: number): number {
  const seed = (id * 2654435761) % (2 ** 32)
  return ((seed % 100) / 100 - 0.5) * 3.4
}

export function makeRegions(categories: Record<string, number[]>): Region[] {
  return Object.keys(categories).map((name) => ({
    id: name,
    name,
    glyph: name.substring(0, 2).toUpperCase(),
  }))
}

export function getNpcForQuest(quest: QuestData, npcs: NPC[]): NPC | undefined {
  return npcs.find((n) => n.dialogId === quest.dialogId)
}
