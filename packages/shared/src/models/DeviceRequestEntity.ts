/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DeviceRequestEntity = {
    userCode: string;
    clientLabel: Record<string, any> | null;
    status: DeviceRequestEntity.status;
    expiresAt: string;
};
export namespace DeviceRequestEntity {
    export enum status {
        PENDING = 'pending',
        APPROVED = 'approved',
        DENIED = 'denied',
    }
}

