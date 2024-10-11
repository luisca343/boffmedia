export enum QuestStatus {
  ACTIVE = "ACTIVE",
  AVAILABLE = "AVAILABLE",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
  LOCKED = "LOCKED",
}

export enum FactionAvailable {
  Is = "Is",
  IsNot = "IsNot",
}

export enum FactionStance {
  Hostile = "Hostile",
  Friendly = "Friendly",
}

export enum ScoreboardType {
  BIGGER = "BIGGER",
  SMALLER = "SMALLER",
  EQUAL = "EQUAL",
}

export interface IQuestCategory {
  quests: number[];
}

export interface IQuestObjective {
  name: string;
  progress: number;
  total: number;
}

export interface IQuestReward {
  item: string;
  count: number;
}

export interface IFactionRequirement {
  factionId: number;
  factionAvailable: FactionAvailable;
  factionStance: FactionStance;
}

export interface IScoreboardRequirement {
  scoreboardObjective: string;
  scoreboardType: ScoreboardType;
  scoreboardValue: number;
}

export interface IQuestRequirements {
  available: boolean;
  requiredQuests: number[];
  requiredDialogs: number[];
  requiredLevel: number;
  requiredTime: number;
  factionRequirements: IFactionRequirement[];
  scoreboardRequirements: IScoreboardRequirement[];
}

export type QuestData = {
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
};

export interface IDialogue {
  id: number;
  name: string;
  text: string;
  questId: number;
  requirements: IQuestRequirements;
}

export interface INPC {
  name: string;
  dialogId: number;
  skin: string;
}

export interface ICategories {
  [key: string]: number[];
}
