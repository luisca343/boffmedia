/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AssignmentAdminDto = {
    id: number;
    eventId: number;
    participantId: number;
    mcUuid: Record<string, any>;
    /**
     * Only present if event.status === finished
     */
    seed: number;
    status: string;
    outputSha512: Record<string, any>;
    logBlobSha512: Record<string, any>;
    claimedAt: Record<string, any>;
    patchedAt: Record<string, any>;
    verifiedAt: Record<string, any>;
    createdAt: string;
    updatedAt: string;
};

