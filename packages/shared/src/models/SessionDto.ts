/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionDto = {
    id: string;
    type: SessionDto.type;
    label: string;
    format: SessionDto.format;
    regulationId: string;
    activePresetId?: string;
    startElo?: number;
    startedAt: number;
    tournamentName?: string;
    limitlessTournamentId?: number;
    archivedAt?: number;
    sessionNotes?: string;
    createdAt?: number;
    updatedAt?: number;
    /**
     * Epoch ms on the device that last wrote this row. The value conflict detection compares — never `updatedAt`, which is the server clock.
     */
    clientUpdatedAt?: number;
};
export namespace SessionDto {
    export enum type {
        LADDER = 'ladder',
        TOURNAMENT = 'tournament',
    }
    export enum format {
        BO1 = 'BO1',
        BO3 = 'BO3',
    }
}

