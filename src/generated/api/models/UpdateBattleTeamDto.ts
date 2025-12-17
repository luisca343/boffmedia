/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateBattleTeamDto = {
    /**
     * Battle team UUID
     */
    uuid: string;
    /**
     * Battle team ID
     */
    id: number;
    /**
     * Updated name of the battle team
     */
    name?: string;
    /**
     * Updated description of the team
     */
    description?: string;
    /**
     * Team slot to update (0-5)
     */
    teamSlot: number;
    /**
     * Pokemon data or null for empty slot
     */
    pokemon?: Record<string, any>;
};

