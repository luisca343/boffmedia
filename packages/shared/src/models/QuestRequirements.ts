/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FactionRequirements } from './FactionRequirements';
import type { ScoreboardRequirements } from './ScoreboardRequirements';
export type QuestRequirements = {
    /**
     * Whether quest is available
     */
    available: boolean;
    /**
     * Required quest IDs
     */
    requiredQuests: Array<number>;
    /**
     * Required dialog IDs
     */
    requiredDialogs: Array<number>;
    /**
     * Required player level
     */
    requiredLevel: number;
    /**
     * Required time (timestamp)
     */
    requiredTime: number;
    /**
     * Faction requirements
     */
    factionRequirements: Array<FactionRequirements>;
    /**
     * Scoreboard requirements
     */
    scoreboardRequirements: Array<ScoreboardRequirements>;
};

