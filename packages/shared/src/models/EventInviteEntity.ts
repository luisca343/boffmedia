/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EventInviteEntity = {
    code: string;
    eventId: number;
    createdBy?: Record<string, any> | null;
    createdAt: string;
    expiresAt?: Record<string, any> | null;
    maxUses: number;
    uses: number;
    revoked: boolean;
};

