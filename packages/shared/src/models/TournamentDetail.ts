/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Competitor } from './Competitor';
import type { PhaseView } from './PhaseView';
import type { TournamentEventContext } from './TournamentEventContext';
export type TournamentDetail = {
    id: number;
    slug: string;
    name: string;
    format: TournamentDetail.format;
    competitorKind: TournamentDetail.competitorKind;
    status: TournamentDetail.status;
    metric: TournamentDetail.metric | null;
    unit: Record<string, any> | null;
    gameId: Record<string, any> | null;
    gameTitle: Record<string, any> | null;
    eventId: Record<string, any> | null;
    /**
     * The event this tournament is composed into, when it has one. An attached tournament draws its field from the event: registering requires an active membership, and a private event makes its tournament private too.
     */
    event?: TournamentEventContext | null;
    /**
     * Entry requires a submitted teamsheet as well as check-in (VGC).
     */
    teamsheetRequired: boolean;
    /**
     * When the field is resolved: everyone not entered by then is dropped.
     */
    entryDeadline: Record<string, any> | null;
    /**
     * Set once the field is resolved; teamsheets are frozen after.
     */
    teamsheetLockedAt: Record<string, any> | null;
    description: Record<string, any> | null;
    rules: Record<string, any> | null;
    /**
     * Prize breakdown (free text).
     */
    prizes: Record<string, any> | null;
    /**
     * Player check-in window open.
     */
    checkInOpen: boolean;
    banner: Record<string, any> | null;
    icon: Record<string, any> | null;
    hue: Record<string, any> | null;
    bestOf: number;
    /**
     * Self-report auto-verify window (minutes); null → default 10.
     */
    autoVerifyMinutes: Record<string, any> | null;
    maxParticipants: Record<string, any> | null;
    registrationOpen: boolean;
    startDate: string | null;
    endDate: string | null;
    champion: Competitor | null;
    participants: Array<Competitor>;
    /**
     * The signed-in caller's own participant id (stringified), or null when anonymous / not registered. Drives the register/withdraw control.
     */
    viewerParticipantId: Record<string, any> | null;
    /**
     * What the signed-in viewer's registration is still missing before it counts as an entry, in the order they fix it. Empty means entered (or not registered at all — check viewerParticipantId). Everyone still short of this when the field is resolved is dropped.
     */
    viewerEntryGaps: Array<'teamsheet' | 'check-in'>;
    /**
     * The caller's currently playable (ready/live) match id — the 'Tu partida' banner.
     */
    myMatchId: Record<string, any> | null;
    /**
     * Top-3 podium, only populated once the tournament completes.
     */
    podium: Array<Competitor>;
    /**
     * Id of the phase the UI should default to (live / last played).
     */
    activePhaseId: Record<string, any> | null;
    /**
     * Ordered phases. Single-phase tournaments carry exactly one entry.
     */
    phases: Array<PhaseView>;
    /**
     * Legacy: the active phase's render model (bracket / double / groups / league / leaderboard). Prefer `phases[].view`.
     */
    view: Record<string, any>;
};
export namespace TournamentDetail {
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
    export enum status {
        DRAFT = 'draft',
        REGISTRATION = 'registration',
        LIVE = 'live',
        COMPLETED = 'completed',
        CANCELLED = 'cancelled',
    }
    export enum metric {
        SCORE = 'score',
        TIME = 'time',
    }
}

