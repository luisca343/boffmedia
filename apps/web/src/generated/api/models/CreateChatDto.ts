/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateChatDto = {
    /**
     * UUID of the player creating the chat
     */
    player: string;
    /**
     * Array of user UUIDs to add to the chat
     */
    users: Array<string>;
    /**
     * Name of the chat
     */
    name: string;
    /**
     * Chat description
     */
    description?: string;
    /**
     * Chat image URL
     */
    image?: string;
};

