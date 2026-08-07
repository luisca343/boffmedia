/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AssignmentClaimedDto = {
    eventId: number;
    status: AssignmentClaimedDto.status;
    gamePlatform: string;
    gameTitle: string;
    cleanRomSha512: string;
    romHint: Record<string, any>;
    eventStatus: string;
    /**
     * SHA-512 of randomized output ROM; present only if patched
     */
    outputSha512: Record<string, any> | null;
};
export namespace AssignmentClaimedDto {
    export enum status {
        PENDING = 'pending',
        CLAIMED = 'claimed',
        PATCHED = 'patched',
        VERIFIED = 'verified',
    }
}

