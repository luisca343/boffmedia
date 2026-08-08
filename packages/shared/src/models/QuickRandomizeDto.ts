/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type QuickRandomizeDto = {
    /**
     * Preset supplying the FVX settings
     */
    presetId: number;
    gamePlatform: QuickRandomizeDto.gamePlatform;
    /**
     * Optional fixed seed; a random one is used when omitted
     */
    seed?: number;
};
export namespace QuickRandomizeDto {
    export enum gamePlatform {
        GBA = 'gba',
        NDS = 'nds',
    }
}

