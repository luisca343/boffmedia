/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TournamentSummary = {
    id: number;
    slug: string;
    name: string;
    format: TournamentSummary.format;
    competitorKind: TournamentSummary.competitorKind;
    status: TournamentSummary.status;
    gameId: Record<string, any> | null;
    gameTitle: Record<string, any> | null;
    banner: Record<string, any> | null;
    icon: Record<string, any> | null;
    hue: Record<string, any> | null;
    maxParticipants: Record<string, any> | null;
    registrationOpen: boolean;
    participantCount: number;
    championName: Record<string, any> | null;
    startDate: string | null;
    endDate: string | null;
};
export namespace TournamentSummary {
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
}

