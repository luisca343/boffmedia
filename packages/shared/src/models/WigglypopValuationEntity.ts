/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WigglypopValuationEntity = {
    /**
     * Rounded to the nearest 50
     */
    value: number;
    rarity: WigglypopValuationEntity.rarity;
};
export namespace WigglypopValuationEntity {
    export enum rarity {
        COMUN = 'comun',
        RARO = 'raro',
        EPICO = 'epico',
        LEGENDARIO = 'legendario',
    }
}

