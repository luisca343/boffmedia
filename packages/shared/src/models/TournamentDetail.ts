/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Competitor } from './Competitor';
import type { PhaseView } from './PhaseView';
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

