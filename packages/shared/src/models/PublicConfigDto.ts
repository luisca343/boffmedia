/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PublicConfigDto = {
    id: number;
    eventId: number;
    gamePlatform: string;
    gameTitle: string;
    cleanRomSha512: string;
    romHint: string | null;
    fvxJarSha512: string;
    /**
     * Only included when config status is published
     */
    settingsBlobSha512: string | null;
    status: PublicConfigDto.status;
    createdAt: string;
};
export namespace PublicConfigDto {
    export enum status {
        DRAFT = 'draft',
        OPEN = 'open',
        CLOSED = 'closed',
        PUBLISHED = 'published',
    }
}

