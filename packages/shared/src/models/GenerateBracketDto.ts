/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GenerateBracketDto = {
    seeding?: GenerateBracketDto.seeding;
    /**
     * Groups format: number of groups.
     */
    groupCount?: number;
    /**
     * Groups format: advancers per group.
     */
    advanceCount?: number;
    /**
     * Swiss format: number of rounds.
     */
    rounds?: number;
    /**
     * Confirm regenerating a bracket that already has results.
     */
    force?: boolean;
    /**
     * Draft preview: build the structure but keep the tournament out of the public "live" state and skip start announcements.
     */
    preview?: boolean;
    /**
     * Keep only checked-in entrants when activating phase 1.
     */
    onlyCheckedIn?: boolean;
};
export namespace GenerateBracketDto {
    export enum seeding {
        AS_SEEDED = 'as-seeded',
        RANDOM = 'random',
        AS_ADDED = 'as-added',
    }
}

