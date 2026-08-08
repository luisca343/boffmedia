/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConfigResponseDto = {
    id: number;
    eventId: number;
    gamePlatform: string;
    gameTitle: string;
    settingsBlobSha512: string;
    fvxJarSha512: string;
    cleanRomSha512: string;
    romHint: Record<string, any>;
    status: ConfigResponseDto.status;
    createdAt: string;
    updatedAt: string;
};
export namespace ConfigResponseDto {
    export enum status {
        DRAFT = 'draft',
        OPEN = 'open',
        CLOSED = 'closed',
        PUBLISHED = 'published',
    }
}

