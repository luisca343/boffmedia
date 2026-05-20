/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RemoveMemberDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Group ID
     */
    groupId: number;
    /**
     * UUID of user to remove
     */
    uuid: string;
    /**
     * UUID of user making the request
     */
    requestingUserUuid: string;
};

