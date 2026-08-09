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
    /**
     * The player's Boffmedia username (from the account the assignment is keyed to). 'Anonymous' if the account was removed.
     */
    displayName: string;
    mcUuid: Record<string, any> | null;
    /**
     * True while the seed is still under seal (config not yet published). The admin table shows a lock; the seed field is withheld until it flips false.
     */
    seedSealed: boolean;
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

