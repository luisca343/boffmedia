/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateEspecieDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    name?: string;
    rarity?: string;
    rarityPts?: number;
    spawnPct?: number;
    shinyPct?: number;
    lvlMin?: number;
    lvlMax?: number;
    /**
     * Officer performing the action, for the audit log
     */
    actorUuid?: string;
};

