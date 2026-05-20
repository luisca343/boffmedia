/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VgcMetaSlotDto } from './VgcMetaSlotDto';
export type SpeciesTeamEntryDto = {
    source: SpeciesTeamEntryDto.source;
    playerId: string;
    playerName: string | null;
    record: string | null;
    rank: string | null;
    slots: Array<VgcMetaSlotDto>;
    rawText: string;
    replicaCode: string | null;
};
export namespace SpeciesTeamEntryDto {
    export enum source {
        VGCPASTES = 'vgcpastes',
        LIMITLESS = 'limitless',
        PASTE = 'paste',
    }
}

