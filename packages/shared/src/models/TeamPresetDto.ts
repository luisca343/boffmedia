/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PresetSlotDto } from './PresetSlotDto';
import type { PresetVersionDto } from './PresetVersionDto';
export type TeamPresetDto = {
    id: string;
    name: string;
    regulationId: string;
    exportString: string;
    slots: Array<PresetSlotDto>;
    createdAt: number;
    updatedAt: number;
    currentVersion: number;
    versions: Array<PresetVersionDto>;
};

