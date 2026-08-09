/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateRomDto = {
    /**
     * Human label
     */
    name: string;
    gamePlatform: CreateRomDto.gamePlatform;
};
export namespace CreateRomDto {
    export enum gamePlatform {
        GBA = 'gba',
        NDS = 'nds',
    }
}

