/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SetStatusDto = {
    status: SetStatusDto.status;
};
export namespace SetStatusDto {
    export enum status {
        DRAFT = 'draft',
        REGISTRATION = 'registration',
        LIVE = 'live',
        COMPLETED = 'completed',
        CANCELLED = 'cancelled',
    }
}

