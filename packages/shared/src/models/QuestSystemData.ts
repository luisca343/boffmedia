/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Dialogue } from './Dialogue';
import type { NPC } from './NPC';
import type { Quest } from './Quest';
import type { QuestCategory } from './QuestCategory';
export type QuestSystemData = {
    /**
     * Available quests
     */
    quests: Array<Quest>;
    /**
     * Quest categories
     */
    categories: Array<QuestCategory>;
    /**
     * Available dialogues
     */
    dialogs: Array<Dialogue>;
    /**
     * NPCs in the system
     */
    npcs: Array<NPC>;
};

