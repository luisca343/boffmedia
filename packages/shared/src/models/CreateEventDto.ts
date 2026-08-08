/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateEventDto = {
    /**
     * Tournament ID
     */
    tournamentId: number;
    /**
     * Game platform
     */
    gamePlatform: string;
    /**
     * FVX game identifier
     */
    gameTitle: string;
    /**
     * Preset whose settings snapshot pins the event (settingsBlobSha512 is derived from it)
     */
    presetId: number;
    /**
     * SHA-512 of clean ROM
     */
    cleanRomSha512: string;
    /**
     * Human-readable ROM hint
     */
    romHint: string;
    /**
     * Pack ID for randomlocke event linkage
     */
    packId?: string;
};

