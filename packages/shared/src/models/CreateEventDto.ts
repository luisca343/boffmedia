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
     * SHA-512 of settings blob
     */
    settingsBlobSha512: string;
    /**
     * SHA-512 of FVX jar
     */
    fvxJarSha512: string;
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

