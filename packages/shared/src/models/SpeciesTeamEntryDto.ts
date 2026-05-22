/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VgcMetaSlotDto } from './VgcMetaSlotDto';
export type SpeciesTeamEntryDto = {
    source: SpeciesTeamEntryDto.source;
    playerId: string;
    playerName: Record<string, any> | null;
    record: Record<string, any> | null;
    rank: Record<string, any> | null;
    slots: Array<VgcMetaSlotDto>;
    rawText: string;
    replicaCode: Record<string, any> | null;
};
export namespace SpeciesTeamEntryDto {
    export enum source {
        VGCPASTES = 'vgcpastes',
        LIMITLESS = 'limitless',
        PASTE = 'paste',
    }
}

