/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameFileEntry } from './GameFileEntry';
export type EuropeAggregateResult = {
    /**
     * Number of releases found
     */
    count: number;
    /**
     * Total aggregated file size
     */
    totalSize: string;
    /**
     * Total aggregated file size in bytes
     */
    totalSizeBytes: number;
    /**
     * Matched game files
     */
    files: Array<GameFileEntry>;
};

