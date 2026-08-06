/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreatePostDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Author UUID
     */
    uuid: string;
    text?: string;
    type?: CreatePostDto.type;
    /**
     * Parent trino id — makes this a reply
     */
    parentId?: number;
    mediaUrl?: string;
    /**
     * rotom_pokedex row id
     */
    captureId?: number;
    /**
     * rotom_replays row id
     */
    replayId?: number;
};
export namespace CreatePostDto {
    export enum type {
        TEXT = 'text',
        MEDIA = 'media',
        CAPTURE = 'capture',
        BATTLE = 'battle',
    }
}

