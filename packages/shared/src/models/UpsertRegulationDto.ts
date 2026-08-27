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
     * @pkmn/sim format ID. Defaults to `id` when omitted. Must resolve in the Dex or the request is rejected with 400.
     */
    formatId?: string;
    /**
     * Display name
     */
    name: string;
    gameType?: UpsertRegulationDto.gameType;
    /**
     * Google Sheet GID for VGCPastes data (null = no sheet)
     */
    vgcPastesGid?: string | null;
    /**
     * Soft-disable switch. false hides the regulation from every picker without deleting its imported data. Defaults to true.
     */
    active?: boolean;
};
export namespace UpsertRegulationDto {
    export enum gameType {
        SINGLES = 'singles',
        DOUBLES = 'doubles',
    }
}

