/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CallUser = {
    /**
     * User UUID
     */
    uuid: string;
    /**
     * User call status
     */
    status: CallUser.status;
};
export namespace CallUser {
    /**
     * User call status
     */
    export enum status {
        RINGING = 'RINGING',
        IN_CALL = 'IN_CALL',
        DECLINED = 'DECLINED',
        BUSY = 'BUSY',
    }
}

