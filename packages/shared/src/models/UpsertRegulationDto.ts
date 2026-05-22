/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpsertRegulationDto = {
    /**
     * Unique regulation ID (matches Drizzle PK)
     */
    id: string;
    /**
     * @pkmn/sim format ID
     */
    formatId: string;
    /**
     * Display name
     */
    name: string;
    gameType?: UpsertRegulationDto.gameType;
    /**
     * Google Sheet GID for VGCPastes data (null = no sheet)
     */
    vgcPastesGid?: Record<string, any>;
};
export namespace UpsertRegulationDto {
    export enum gameType {
        SINGLES = 'singles',
        DOUBLES = 'doubles',
    }
}

