/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FileDownloadEntry = {
    filename: string;
    status: FileDownloadEntry.status;
    size?: string;
    sizeBytes?: number;
    error?: string;
};
export namespace FileDownloadEntry {
    export enum status {
        DOWNLOADED = 'downloaded',
        SKIPPED = 'skipped',
        FAILED = 'failed',
    }
}

