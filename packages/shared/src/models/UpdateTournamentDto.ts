/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePhaseDto } from './CreatePhaseDto';
export type UpdateTournamentDto = {
    name?: string;
    /**
     * URL slug; derived from the name when omitted.
     */
    slug?: string;
    format?: UpdateTournamentDto.format;
    competitorKind?: UpdateTournamentDto.competitorKind;
    gameId?: number;
    eventId?: number;
    metric?: UpdateTournamentDto.metric;
    /**
     * Leaderboard unit, e.g. "pts" or "s".
     */
    unit?: string;
    maxParticipants?: number;
    registrationOpen?: boolean;
    /**
     * Games per match (BO1/BO3/BO5).
     */
    bestOf?: number;
    /**
     * Minutes a self-reported result waits for rival confirmation before auto-verifying. Null → the platform default (10).
     */
    autoVerifyMinutes?: number;
    /**
     * Groups format: number of groups.
     */
    groupCount?: number;
    /**
     * Advancers per group (groups format).
     */
    advanceCount?: number;
    description?: string;
    rules?: string;
    /**
     * Prize breakdown (free text).
     */
    prizes?: string;
    /**
     * Player check-in window open.
     */
    checkInOpen?: boolean;
    /**
     * Entry requires a submitted teamsheet as well as check-in (VGC). Set explicitly — it is NOT derived from the game, whose title is free text.
     */
    teamsheetRequired?: boolean;
    /**
     * Who may read other entrants' teamsheets once the tournament is live. Independent of `teamsheetRequired` — a tournament can demand sheets and keep them private, or publish sheets it never demanded. Never reveals anything before the start.
     */
    teamsheetVisibility?: UpdateTournamentDto.teamsheetVisibility;
    /**
     * When the field is frozen: everyone who has not entered by then is dropped and teamsheets lock. Omit to resolve on generate only.
     */
    entryDeadline?: string;
    banner?: string;
    icon?: string;
    hue?: number;
    startDate?: string;
    endDate?: string;
    /**
     * Ordered phases (array order = phase order). Omitted → a single phase is synthesized from `format` (full back-compat).
     */
    phases?: Array<CreatePhaseDto>;
};
export namespace UpdateTournamentDto {
    export enum format {
        SINGLE = 'single',
        DOUBLE = 'double',
        GROUPS = 'groups',
        ROUNDROBIN = 'roundrobin',
        SWISS = 'swiss',
        LEADERBOARD = 'leaderboard',
    }
    export enum competitorKind {
        SOLO = 'solo',
        TEAM = 'team',
        ENTRY = 'entry',
    }
    export enum metric {
        SCORE = 'score',
        TIME = 'time',
    }
    /**
     * Who may read other entrants' teamsheets once the tournament is live. Independent of `teamsheetRequired` — a tournament can demand sheets and keep them private, or publish sheets it never demanded. Never reveals anything before the start.
     */
    export enum teamsheetVisibility {
        PRIVATE = 'private',
        PARTICIPANTS = 'participants',
        PUBLIC = 'public',
    }
}

