/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdatePhaseDto = {
    name?: string;
    format?: UpdatePhaseDto.format;
    /**
     * Games per match; falls back to tournament.bestOf.
     */
    bestOf?: number;
    /**
     * Best-of override for the decisive match (single: final · double: grand final).
     */
    finalsBestOf?: number;
    /**
     * Swiss: fixed number of rounds.
     */
    rounds?: number;
    /**
     * Groups: number of groups.
     */
    groupCount?: number;
    /**
     * Single: also play a third-place match between semifinal losers.
     */
    thirdPlace?: boolean;
    /**
     * Fold the previous phase records into this phase.
     */
    carryStandings?: boolean;
    /**
     * Null on the final phase.
     */
    advanceType?: UpdatePhaseDto.advanceType;
    /**
     * top_n: N · record: optional cap by standings order.
     */
    advanceCount?: number;
    /**
     * record: max losses to advance (2 → "X-2 or better").
     */
    advanceMaxLosses?: number;
    tiebreakProfile?: UpdatePhaseDto.tiebreakProfile;
    startDate?: string;
    endDate?: string;
};
export namespace UpdatePhaseDto {
    export enum format {
        SINGLE = 'single',
        DOUBLE = 'double',
        ROUNDROBIN = 'roundrobin',
        SWISS = 'swiss',
        LEADERBOARD = 'leaderboard',
        GROUPS = 'groups',
    }
    /**
     * Null on the final phase.
     */
    export enum advanceType {
        ALL = 'all',
        TOP_N = 'top_n',
        RECORD = 'record',
        TOP_OR_RECORD = 'top_or_record',
    }
    export enum tiebreakProfile {
        POINTS = 'points',
        RESISTANCE = 'resistance',
    }
}

