/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SubmitAnswerDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Session ID
     */
    sessionId: number;
    /**
     * Player UUID
     */
    playerUuid: string;
    /**
     * Answer index (0-3)
     */
    answerIndex: number;
};

