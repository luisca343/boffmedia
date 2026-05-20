/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestRequirements } from './QuestRequirements';
export type NPC = {
    /**
     * NPC ID
     */
    id: number;
    /**
     * NPC name
     */
    name: string;
    /**
     * NPC dialogue text
     */
    text: string;
    /**
     * Associated quest ID
     */
    questId: number;
    /**
     * NPC requirements
     */
    requirements: QuestRequirements;
};

