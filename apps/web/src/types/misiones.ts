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

/** An NPC that speaks a dialog. The only place a giver's skin and coords exist. */
export interface NpcLocation {
  name: string;
  dialogId: number;
  skin: string;
  x: number;
  y: number;
  z: number;
  world: string;
  uuid: string;
}

// Kept local: the shared Dialogue has no npcLocations — only the mod sends them
export interface IDialogue extends Dialogue {
  npcLocations: NpcLocation[];
}

/**
 * What the mod's `getMisiones` returns: definitions and progress already merged,
 * the same shape the API's `/misiones/user` serves. `npcs` is always empty — the
 * givers ride on `dialogs[].npcLocations`.
 */
export interface UserQuestData {
  quests: QuestData[];
  categories: Record<string, number[]>;
  dialogs: IDialogue[];
  npcs: NPC[];
}

// Kept local: references local QuestData[] and extended NPC[]
export interface QuestSystemData {
  quests: QuestData[];
  categories: IQuestCategory[];
  dialogs: IDialogue[];
  npcs: NPC[];
}



