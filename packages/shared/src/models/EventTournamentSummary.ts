/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EventTournamentSummary = {
    id: number;
    slug: string;
    name: string;
    status: EventTournamentSummary.status;
};
export namespace EventTournamentSummary {
    export enum status {
        DRAFT = 'draft',
        REGISTRATION = 'registration',
        LIVE = 'live',
        COMPLETED = 'completed',
        CANCELLED = 'cancelled',
    }
}

