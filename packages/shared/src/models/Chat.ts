/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMember } from './ChatMember';
import type { ChatMessage } from './ChatMessage';
export type Chat = {
    /**
     * Chat ID
     */
    id: number;
    /**
     * Chat name
     */
    name: string;
    /**
     * Chat type (0=public, 1=private, 2=direct, 3=group)
     */
    type: number;
    /**
     * Chat description
     */
    description: string;
    /**
     * Chat image URL
     */
    image: string;
    /**
     * Chat creation date
     */
    createdAt: string;
    /**
     * Chat last update date
     */
    updatedAt: string;
    /**
     * Recent messages in the chat
     */
    messages: Array<ChatMessage>;
    /**
     * Number of unread messages
     */
    unread: number;
    /**
     * Chat members
     */
    members: Array<ChatMember>;
};

