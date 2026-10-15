/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConcursosDeviceRecoveryDto = {
    id: string;
    roomCode: string;
    memberId: string;
    nickname: string;
    verificationCode: string;
    status: ConcursosDeviceRecoveryDto.status;
    createdAt: number;
    expiresAt: number;
    serverNow: number;
};
export namespace ConcursosDeviceRecoveryDto {
    export enum status {
        PENDING = 'pending',
        APPROVED = 'approved',
        DENIED = 'denied',
        EXPIRED = 'expired',
        CANCELLED = 'cancelled',
        SUPERSEDED = 'superseded',
        CLOSED = 'closed',
    }
}

