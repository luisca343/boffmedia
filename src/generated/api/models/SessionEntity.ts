/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionEntity = {
    /**
     * Session ID
     */
    id: number;
    /**
     * Session code
     */
    sessionCode: string;
    /**
     * Conductor UUID
     */
    conductorUuid: string;
    /**
     * Session status
     */
    status: string;
    /**
     * Current question number (0-14)
     */
    currentQuestion: number;
    /**
     * Remaining lifelines
     */
    lifelinesRemaining: Record<string, any>;
    /**
     * Session creation time
     */
    createdAt: string;
    /**
     * Last update time
     */
    updatedAt: string;
};

