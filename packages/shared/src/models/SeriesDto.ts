/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchNoteDto } from './MatchNoteDto';
import type { SeriesGameDto } from './SeriesGameDto';
import type { TeamSnapshotDto } from './TeamSnapshotDto';
export type SeriesDto = {
    id: string;
    sessionId: string;
    createdAt: number;
    completedAt?: number;
    roundNumber?: number;
    opponentName?: string;
    opponentArchetype?: string;
    myTeam: TeamSnapshotDto;
    opponentTeam: TeamSnapshotDto;
    games: Array<SeriesGameDto>;
    seriesResult?: SeriesDto.seriesResult;
    notes: Array<MatchNoteDto>;
    updatedAt?: number;
};
export namespace SeriesDto {
    export enum seriesResult {
        WIN = 'win',
        LOSS = 'loss',
        DRAW = 'draw',
    }
}

