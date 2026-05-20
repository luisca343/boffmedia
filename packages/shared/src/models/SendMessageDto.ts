/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FicusMessageContentDto } from './FicusMessageContentDto';
export type SendMessageDto = {
    /**
     * Server identifier
     */
    server?: string;
    /**
     * UUID of the player/user
     */
    uuid: string;
    /**
     * Message content to send
     */
    mensaje: FicusMessageContentDto;
};

