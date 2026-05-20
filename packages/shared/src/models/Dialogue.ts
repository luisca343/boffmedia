/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestRequirements } from './QuestRequirements';
export type Dialogue = {
    /**
     * Dialogue ID
     */
    id: number;
    /**
     * Dialogue name/title
     */
    name: string;
    /**
     * Dialogue text content
     */
    text: string;
    /**
     * Associated quest ID
     */
    questId: number;
    /**
     * Dialogue requirements
     */
    requirements: QuestRequirements;
};

