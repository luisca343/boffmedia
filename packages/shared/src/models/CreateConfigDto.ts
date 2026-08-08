/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateConfigDto = {
    /**
     * BoffMedia Event ID
     */
    eventId: number;
    /**
     * Game platform
     */
    gamePlatform: string;
    /**
     * FVX game identifier
     */
    gameTitle: string;
    /**
     * Preset whose settings snapshot pins the config (settingsBlobSha512 is derived from it)
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
};

