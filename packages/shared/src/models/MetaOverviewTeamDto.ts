/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VgcMetaSlotDto } from './VgcMetaSlotDto';
export type MetaOverviewTeamDto = {
    id: string;
    tournamentId: number;
    tournamentName: string | null;
    tournamentDate: string | null;
    playerName: string;
    placing: number;
    record: string;
    slots: Array<VgcMetaSlotDto>;
    rawText: string;
};

