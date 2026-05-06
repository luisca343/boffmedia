/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FetchSmogonDto = {
    /**
     * Showdown format ID
     */
    format: string;
    /**
     * Month in YYYY-MM format
     */
    month: string;
    cutoff?: FetchSmogonDto.cutoff;
};
export namespace FetchSmogonDto {
    export enum cutoff {
        '_0' = 0,
        '_1500' = 1500,
        '_1630' = 1630,
        '_1760' = 1760,
    }
}

