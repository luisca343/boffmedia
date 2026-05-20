/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateMessageDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Message ID
     */
    messageId: number;
    /**
     * New message content
     */
    content: string;
    /**
     * UUID of user updating the message
     */
    uuid: string;
};

