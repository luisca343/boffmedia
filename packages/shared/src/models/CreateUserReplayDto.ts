/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateUserReplayDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Replay ID
     */
    replayId: number;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Player side (1 or 2)
     */
    side: number;
};

