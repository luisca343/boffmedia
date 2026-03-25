/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestObjective } from './QuestObjective';
import type { QuestRequirements } from './QuestRequirements';
import type { QuestReward } from './QuestReward';
export type Quest = {
    /**
     * Quest ID
     */
    id: number;
    /**
     * Quest name
     */
    name: string;
    /**
     * Quest log text
     */
    logText: string;
    /**
     * Quest completion text
     */
    completeText: string;
    /**
     * Whether quest is repeatable
     */
    repeatable: boolean;
    /**
     * Quest type ID
     */
    type: number;
    /**
     * Next quest ID
     */
    nextQuest: number;
    /**
     * Quest category
     */
    category: string;
    /**
     * Quest status
     */
    status: Quest.status;
    /**
     * Quest objectives
     */
    objectives: Array<QuestObjective>;
    /**
     * Quest requirements
     */
    requirements: QuestRequirements;
    /**
     * Dialog ID
     */
    dialogId: number;
    /**
     * Quest rewards
     */
    rewards: Array<QuestReward>;
};
export namespace Quest {
    /**
     * Quest status
     */
    export enum status {
        ACTIVE = 'ACTIVE',
        COMPLETED = 'COMPLETED',
        FAILED = 'FAILED',
        AVAILABLE = 'AVAILABLE',
        LOCKED = 'LOCKED',
        NOT_STARTED = 'NOT_STARTED',
    }
}

