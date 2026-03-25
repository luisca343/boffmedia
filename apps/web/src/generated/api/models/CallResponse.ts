/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CallSession } from './CallSession';
export type CallResponse = {
    /**
     * Whether the operation was successful
     */
    success: boolean;
    /**
     * Response message
     */
    message: string;
    /**
     * Call session details
     */
    callSession?: CallSession;
};

