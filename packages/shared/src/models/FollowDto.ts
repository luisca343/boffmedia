/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FollowDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Follower UUID
     */
    uuid: string;
    /**
     * UUID being followed
     */
    targetUuid: string;
};

