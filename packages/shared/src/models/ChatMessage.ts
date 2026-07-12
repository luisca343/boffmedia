/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageReaction } from './MessageReaction';
export type ChatMessage = {
    /**
     * Message ID
     */
    id: number;
    /**
     * Message content
     */
    content: string;
    /**
     * Message creation date
     */
    createdAt: string;
    /**
     * Sender UUID
     */
    uuid?: string;
    /**
     * Message type
     */
    type?: Record<string, any>;
    /**
     * Reactions on this message
     */
    reactions?: Array<MessageReaction>;
    /**
     * Delivery status of the message (for the sender)
     */
    status?: ChatMessage.status;
};
export namespace ChatMessage {
    /**
     * Delivery status of the message (for the sender)
     */
    export enum status {
        SENT = 'sent',
        DELIVERED = 'delivered',
        READ = 'read',
    }
}

