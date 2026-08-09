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
     * Library ROM to pin as the clean base. The server copies its sha512 (execution value) and records rom_id (provenance); the platform must match gamePlatform.
     */
    romId: number;
    /**
     * Emulator pack to attach to the event. The launcher resolves pack → event → config, so this is what makes the config reachable in the launcher.
     */
    packId: string;
    /**
     * Human-readable ROM hint
     */
    romHint: string;
};

