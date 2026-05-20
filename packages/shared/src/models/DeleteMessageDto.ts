/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DeleteMessageDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Message ID
     */
    messageId: number;
    /**
     * UUID of user deleting the message
     */
    uuid: string;
};

