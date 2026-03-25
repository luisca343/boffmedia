/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateMessageDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Sender UUID
     */
    uuid: string;
    /**
     * Message content
     */
    message: string;
    /**
     * Type of message
     */
    type?: CreateMessageDto.type;
};
export namespace CreateMessageDto {
    /**
     * Type of message
     */
    export enum type {
        TEXT = 'text',
        CALL = 'call',
        SYSTEM = 'system',
        IMAGE = 'image',
        STICKER = 'sticker',
        EMOJI = 'emoji',
        VIDEO = 'video',
        DOCUMENT = 'document',
        WAYPOINT = 'waypoint',
        CHAT = 'chat',
    }
}

