import { QuestStatus } from "@/types/misiones"

export const STATUS_LABEL: Record<QuestStatus, string> = {
  [QuestStatus.ACTIVE]: "Vigente",
  [QuestStatus.AVAILABLE]: "Disponible",
  [QuestStatus.COMPLETED]: "Completada",
  [QuestStatus.FAILED]: "Fallida",
  [QuestStatus.LOCKED]: "Sellada",
  [QuestStatus.NOT_STARTED]: "Sin empezar",
}

export const STATUS_GLYPH: Record<QuestStatus, string> = {
  [QuestStatus.ACTIVE]: "V",
  [QuestStatus.AVAILABLE]: "D",
  [QuestStatus.COMPLETED]: "C",
  [QuestStatus.FAILED]: "F",
  [QuestStatus.LOCKED]: "L",
  [QuestStatus.NOT_STARTED]: "N",
}

export const STATUS_COLOR: Record<QuestStatus, string> = {
  [QuestStatus.ACTIVE]: "var(--seal-active)",
  [QuestStatus.AVAILABLE]: "var(--seal-available)",
  [QuestStatus.COMPLETED]: "var(--seal-completed)",
  [QuestStatus.FAILED]: "var(--seal-failed)",
  [QuestStatus.LOCKED]: "var(--seal-locked)",
  [QuestStatus.NOT_STARTED]: "var(--seal-locked)",
}
