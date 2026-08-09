/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AssignmentClaimedDto = {
    eventId: string;
    status: AssignmentClaimedDto.status;
    gamePlatform: string;
    gameTitle: string;
    cleanRomSha512: string;
    romHint: Record<string, any>;
    configStatus: string;
    /**
     * SHA-512 of randomized output ROM; present only if patched
     */
    outputSha512: string | null;
};
export namespace AssignmentClaimedDto {
    export enum status {
        CLAIMED = 'claimed',
        PATCHED = 'patched',
        VERIFIED = 'verified',
    }
}

