/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SmartRotomUser } from './SmartRotomUser';
export type InitializationResult = {
    /**
     * The user data
     */
    user: SmartRotomUser;
    /**
     * User accounts data
     */
    accounts: Array<Record<string, any>>;
    /**
     * Whether this is a newly created user
     */
    isNewUser: boolean;
    /**
     * Whether new accounts were created
     */
    isNewAccount: boolean;
};

