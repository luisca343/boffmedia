/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessagePartDto } from './MessagePartDto';
import type { MessageSender } from './MessageSender';
export type FicusMessageContentDto = {
    /**
     * Sender of the message
     */
    sender: MessageSender;
    /**
     * Parts of the message
     */
    parts: Array<MessagePartDto>;
};

