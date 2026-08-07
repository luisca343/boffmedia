/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EventResponseDto = {
    id: number;
    tournamentId: number;
    gamePlatform: string;
    gameTitle: string;
    settingsBlobSha512: string;
    fvxJarSha512: string;
    cleanRomSha512: string;
    romHint: Record<string, any>;
    status: EventResponseDto.status;
    createdAt: string;
    updatedAt: string;
};
export namespace EventResponseDto {
    export enum status {
        DRAFT = 'draft',
        LOCKED = 'locked',
        RUNNING = 'running',
        FINISHED = 'finished',
    }
}

