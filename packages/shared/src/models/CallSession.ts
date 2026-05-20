/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CallUser } from './CallUser';
export type CallSession = {
    /**
     * Unique call identifier
     */
    callId: string;
    /**
     * Chat ID
     */
    chatId: number;
    /**
     * Caller UUID
     */
    caller: string;
    /**
     * Users participating in the call
     */
    users: Array<CallUser>;
    /**
     * Call start timestamp
     */
    startTime?: number;
};

