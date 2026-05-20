/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SmartRotomUser } from './SmartRotomUser';
export type FindOrCreateResult = {
    /**
     * The user data
     */
    user: SmartRotomUser;
    /**
     * Whether this is a newly created user
     */
    isNew: boolean;
    /**
     * Status of the operation
     */
    status: FindOrCreateResult.status;
};
export namespace FindOrCreateResult {
    /**
     * Status of the operation
     */
    export enum status {
        FOUND = 'found',
        CREATED = 'created',
    }
}

