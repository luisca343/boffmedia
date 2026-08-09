/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type McLinkPollEntity = {
    status: McLinkPollEntity.status;
    uuid?: string;
    username?: string;
};
export namespace McLinkPollEntity {
    export enum status {
        PENDING = 'pending',
        LINKED = 'linked',
        DECLINED = 'declined',
        EXPIRED = 'expired',
    }
}

