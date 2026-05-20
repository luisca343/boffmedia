/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NPCData } from './NPCData';
export type UpdateNPCsDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Array of NPC objects
     */
    npcs: Array<NPCData>;
};

