/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileDownloadEntry } from './FileDownloadEntry';
export type BulkDownloadResult = {
    console: string;
    consoleLabel: string;
    regions: Array<string>;
    totalMatched: number;
    downloaded: number;
    /**
     * Files that already existed locally and were skipped
     */
    skipped: number;
    failed: number;
    /**
     * Files abandoned because the connection stopped sending bytes. Their partial data was deleted.
     */
    stalled: number;
    /**
     * Files not attempted or aborted because the caller cancelled.
     */
    cancelled: number;
    totalDownloadedSize: string;
    totalDownloadedSizeBytes: number;
    files: Array<FileDownloadEntry>;
};

