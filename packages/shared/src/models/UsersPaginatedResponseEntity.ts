/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BoffMediaUserEntity } from './BoffMediaUserEntity';
export type UsersPaginatedResponseEntity = {
    /**
     * List of users
     */
    users: Array<BoffMediaUserEntity>;
    /**
     * Total number of matching users
     */
    total: number;
    /**
     * Requested page size
     */
    limit?: number;
    /**
     * Requested page offset
     */
    offset?: number;
};

