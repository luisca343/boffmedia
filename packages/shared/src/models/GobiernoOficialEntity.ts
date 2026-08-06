/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GobiernoOficialRankEntity } from './GobiernoOficialRankEntity';
export type GobiernoOficialEntity = {
    uuid: string;
    /**
     * Backs the derived badge number
     */
    userId: number;
    username: string;
    profilePicture?: Record<string, any> | null;
    roles: Array<string>;
    /**
     * Highest GOB_* rank held — null if the officer only holds the base GOBIERNO role
     */
    rank?: GobiernoOficialRankEntity | null;
};

