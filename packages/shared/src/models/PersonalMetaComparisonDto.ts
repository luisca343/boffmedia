/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonalMetaComparisonRowDto } from './PersonalMetaComparisonRowDto';
export type PersonalMetaComparisonDto = {
    regulationId: string;
    source: PersonalMetaComparisonDto.source;
    personalSampleSize: number;
    rowCount: number;
    rows: Array<PersonalMetaComparisonRowDto>;
};
export namespace PersonalMetaComparisonDto {
    export enum source {
        SMOGON = 'smogon',
        CHAMPIONS = 'champions',
        LIMITLESS = 'limitless',
    }
}

