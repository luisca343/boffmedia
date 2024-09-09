

export enum QuestStatus {
    ACTIVE= "ACTIVE",
    COMPLETED= "COMPLETED",
    FAILED = "FAILED",
    AVAILABLE = "AVAILABLE",
    LOCKED = "LOCKED",
}

export interface IDialogue {
    id: number;
    name: string;
    text: string;
    questId: number;
    requirements: IQuestRequirements;
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

export interface ScoreboardRequirements {
    scoreboardObjective: string;
    scoreboardType: string;
    scoreboardValue: number;
    
}

export interface FactionRequirements {
    factionId: number;
    factionAvailable: string;
    factionStance: string;
}

export interface IQuestRequirements {
    available: boolean;
    requiredQuests: number[];
    requiredDialogs: number[];
    requiredLevel: number;
    requiredTime: number;
    factionRequirements: FactionRequirements[];
    scoreboardRequirements: ScoreboardRequirements[];
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
}