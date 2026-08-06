/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RosterMemberDto } from './RosterMemberDto';
export type RegisterParticipantDto = {
    /**
     * Display name override (team name for team tournaments).
     */
    name?: string;
    tag?: string;
    /**
     * ISO alpha-2 country code.
     */
    country?: string;
    roster?: Array<RosterMemberDto>;
};

