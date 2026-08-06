/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RosterMemberDto } from './RosterMemberDto';
export type AddParticipantDto = {
    kind?: AddParticipantDto.kind;
    /**
     * Linked user id (solo competitors).
     */
    userId?: number;
    name: string;
    tag?: string;
    /**
     * ISO alpha-2 country code.
     */
    country?: string;
    seed?: number;
    hue?: number;
    /**
     * Leaderboard-format score.
     */
    score?: number;
    /**
     * Leaderboard meta line.
     */
    meta?: string;
    verified?: boolean;
    roster?: Array<RosterMemberDto>;
};
export namespace AddParticipantDto {
    export enum kind {
        SOLO = 'solo',
        TEAM = 'team',
        ENTRY = 'entry',
    }
}

