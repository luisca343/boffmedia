/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DivergenceRowDto = {
    speciesId: string;
    speciesName: string;
    ladderPercent: number;
    tournamentPercent: number;
    deltaPercent: number;
    absDeltaPercent: number;
    badge: DivergenceRowDto.badge | null;
};
export namespace DivergenceRowDto {
    export enum badge {
        LADDER_TRAP = 'ladder-trap',
        TOURNAMENT_STAPLE = 'tournament-staple',
    }
}

