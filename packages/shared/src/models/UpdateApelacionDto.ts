/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateApelacionDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    grounds?: string;
    /**
     * Only non-terminal transitions — use /resolve for upheld/overturned
     */
    status?: UpdateApelacionDto.status;
};
export namespace UpdateApelacionDto {
    /**
     * Only non-terminal transitions — use /resolve for upheld/overturned
     */
    export enum status {
        PENDING = 'pending',
        REVIEWING = 'reviewing',
    }
}

