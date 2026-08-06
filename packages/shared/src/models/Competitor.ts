/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RosterMember } from './RosterMember';
export type Competitor = {
    /**
     * Stringified participant id.
     */
    id: string;
    kind: Competitor.kind;
    name: string;
    tag: Record<string, any> | null;
    /**
     * ISO alpha-2 country code.
     */
    country: Record<string, any> | null;
    /**
     * Emoji flag derived from country.
     */
    flag: Record<string, any> | null;
    seed: Record<string, any> | null;
    status: Competitor.status;
    /**
     * Checked in for the current check-in window.
     */
    checkedIn: boolean;
    hue: Record<string, any> | null;
    avatar: Record<string, any> | null;
    /**
     * Leaderboard-format score.
     */
    score: Record<string, any> | null;
    /**
     * Leaderboard-format: entry verified by an admin.
     */
    verified: boolean;
    roster?: Array<RosterMember>;
};
export namespace Competitor {
    export enum kind {
        SOLO = 'solo',
        TEAM = 'team',
        ENTRY = 'entry',
    }
    export enum status {
        ACTIVE = 'active',
        ELIMINATED = 'eliminated',
        WITHDREW = 'withdrew',
        DISQUALIFIED = 'disqualified',
    }
}

