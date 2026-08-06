/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateParticipantDto = {
    name?: string;
    tag?: string;
    country?: string;
    seed?: number;
    hue?: number;
    /**
     * Leaderboard score.
     */
    score?: number;
    meta?: string;
    verified?: boolean;
    /**
     * Assign to a group (groups format).
     */
    groupId?: number;
    status?: UpdateParticipantDto.status;
};
export namespace UpdateParticipantDto {
    export enum status {
        ACTIVE = 'active',
        ELIMINATED = 'eliminated',
        WITHDREW = 'withdrew',
        DISQUALIFIED = 'disqualified',
    }
}

