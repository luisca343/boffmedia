/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DivergenceRowDto } from './DivergenceRowDto';
export type DivergenceResultDto = {
    regulationId: string;
    tournamentId: number | null;
    ladderFormat: string;
    ladderMonth: string;
    ladderCutoff: number;
    rowCount: number;
    rows: Array<DivergenceRowDto>;
};

