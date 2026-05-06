/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSessionDto = {
    id: string;
    label: string;
    format: CreateSessionDto.format;
    regulationId: string;
    type?: CreateSessionDto.type;
    activePresetId?: string;
    startElo?: number;
    startedAt?: number;
    archivedAt?: number;
    tournamentName?: string;
    limitlessTournamentId?: number;
    sessionNotes?: string;
    clientUpdatedAt?: number;
    userId?: number;
};
export namespace CreateSessionDto {
    export enum format {
        BO1 = 'BO1',
        BO3 = 'BO3',
    }
    export enum type {
        LADDER = 'ladder',
        TOURNAMENT = 'tournament',
    }
}

