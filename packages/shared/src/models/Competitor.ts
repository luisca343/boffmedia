/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RosterMember } from './RosterMember';
import type { TeamsheetMonDto } from './TeamsheetMonDto';
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
    /**
     * This entrant's open teamsheet, or null when the caller may not read it. Sent to admins always, and to the audience named by the tournament's `teamsheetVisibility` — but never before the tournament is live, so no one builds a team against a roster they have already read. Populated only on the tournament detail; the participants list never carries sheets.
     */
    teamsheet: Array<TeamsheetMonDto> | null;
    /**
     * What this registration is still missing before it counts as an entry — who is about to be dropped, and why. Admin-only: null for everyone else. A player reads their own through `viewerEntryGaps`.
     */
    entryGaps: Array<'teamsheet' | 'check-in'> | null;
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

