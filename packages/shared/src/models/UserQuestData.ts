/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Dialogue } from './Dialogue';
import type { NPC } from './NPC';
import type { Quest } from './Quest';
import type { QuestCategory } from './QuestCategory';
export type UserQuestData = {
    /**
     * User-specific quest data with progress
     */
    quests: Array<Quest>;
    /**
     * Available dialogues for user
     */
    dialogs: Array<Dialogue>;
    /**
     * Quest categories
     */
    categories: Array<QuestCategory>;
    /**
     * NPCs available to user
     */
    npcs: Array<NPC>;
};

