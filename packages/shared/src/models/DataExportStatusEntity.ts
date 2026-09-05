/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DataExportStatusEntity = {
    /**
     * Export request id
     */
    id: number;
    /**
     * pending = queued, ready = downloadable, failed = try again, expired = the file has been deleted
     */
    status: DataExportStatusEntity.status;
    requestedAt: string;
    completedAt: string | null;
    /**
     * When the archive stops being downloadable.
     */
    expiresAt: string | null;
    /**
     * Size of the archive in bytes, once it exists.
     */
    sizeBytes: number | null;
};
export namespace DataExportStatusEntity {
    /**
     * pending = queued, ready = downloadable, failed = try again, expired = the file has been deleted
     */
    export enum status {
        PENDING = 'pending',
        READY = 'ready',
        FAILED = 'failed',
        EXPIRED = 'expired',
    }
}

