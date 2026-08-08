/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PublicAssignmentDto = {
    id: number;
    configId: number;
    /**
     * User display name (from boffMediaUsers)
     */
    displayName: string;
    status: PublicAssignmentDto.status;
    /**
     * Only present if config.status === published
     */
    seed: string | null;
    /**
     * Sha512 of the randomized ROM output
     */
    outputSha512: string | null;
    claimedAt: string | null;
    patchedAt: string | null;
    verifiedAt: string | null;
    createdAt: string;
};
export namespace PublicAssignmentDto {
    export enum status {
        CLAIMED = 'claimed',
        PATCHED = 'patched',
        VERIFIED = 'verified',
    }
}

