/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AssignmentAdminDto = {
    id: number;
    configId: number;
    /**
     * BoffMedia User ID if linked
     */
    boffmediaUserId: number | null;
    mcUuid: string;
    /**
     * Only present if config.status === published
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

