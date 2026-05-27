import type {
  Dialogue,
  FactionRequirements,
  QuestCategory,
  QuestObjective,
  QuestRequirements,
  QuestReward,
  ScoreboardRequirements,
} from '@boffmedia/shared';

export type { FactionRequirements, ScoreboardRequirements };

// Backward-compatible I-prefix aliases for shared types
export type IDialogue          = Dialogue;
export type IQuestCategory     = QuestCategory;
export type IQuestObjective    = QuestObjective;
export type IQuestReward       = QuestReward;
export type IQuestRequirements = QuestRequirements;

// Kept local: string enum values match Quest.status but consumers depend on this enum shape
export enum QuestStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  NOT_STARTED = 'NOT_STARTED',
}

// Kept local: status field uses QuestStatus enum (not Quest.status namespace enum)
export interface QuestData {
  id: number;
  name: string;
  logText: string;
  completeText: string;
  repeatable: boolean;
  type: number;
  nextQuest: number;
  category: string;
  npcName?: string;
  status: QuestStatus;
  objectives: IQuestObjective[];
  requirements: IQuestRequirements;
  dialogId: number;
  rewards: IQuestReward[];
}

// Kept local: extends shared NPC with Minecraft-specific skin + dialogId fields
export interface NPC {
  id: number;
  name: string;
  text: string;
  questId: number;
  requirements: IQuestRequirements;
  skin: string;
  dialogId: number;
}

// Kept local: references local QuestData[] and extended NPC[]
export interface QuestSystemData {
  quests: QuestData[];
  categories: IQuestCategory[];
  dialogs: IDialogue[];
  npcs: NPC[];
}

// NPC with real world coordinates from /npcs/catalog endpoint
export interface NPCCatalogEntry {
  name: string;
  dialogId: number;
  skin: string;
  x: number;
  y: number;
  z: number;
  world: string;
  uuid: string;
}

// Response shape: keys are dialogId strings
export type NPCCatalogResponse = Record<string, NPCCatalogEntry[]>;



