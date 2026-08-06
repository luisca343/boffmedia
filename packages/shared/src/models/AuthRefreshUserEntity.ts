/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthRefreshSmartRotomUserEntity } from './AuthRefreshSmartRotomUserEntity';
export type AuthRefreshUserEntity = {
    /**
     * User ID
     */
    id: number;
    /**
     * Username
     */
    name: string;
    /**
     * User email address
     */
    email: string;
    /**
     * Role names assigned to the user
     */
    roles: Array<string>;
    /**
     * Profile picture URL
     */
    image: string | null;
    /**
     * Linked SmartRotom user data, if any
     */
    smartRotomUser: AuthRefreshSmartRotomUserEntity | null;
};

