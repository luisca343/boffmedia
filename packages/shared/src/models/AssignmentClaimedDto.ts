/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AssignmentClaimedDto = {
    status: AssignmentClaimedDto.status;
    gamePlatform: string;
    gameTitle: string;
    cleanRomSha512: string;
    romHint: Record<string, any>;
    eventStatus: string;
};
export namespace AssignmentClaimedDto {
    export enum status {
        PENDING = 'pending',
        CLAIMED = 'claimed',
        PATCHED = 'patched',
        VERIFIED = 'verified',
    }
}

