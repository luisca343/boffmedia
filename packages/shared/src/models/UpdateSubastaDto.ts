/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateSubastaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    startBid?: number;
    reason?: string;
    endsAt?: string;
    /**
     * Manual status override — prefer POST :id/close to settle a live auction
     */
    status?: UpdateSubastaDto.status;
};
export namespace UpdateSubastaDto {
    /**
     * Manual status override — prefer POST :id/close to settle a live auction
     */
    export enum status {
        LIVE = 'live',
        CLOSED = 'closed',
        CANCELLED = 'cancelled',
    }
}

