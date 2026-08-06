/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SmartRotomUserEntity } from './SmartRotomUserEntity';
export type AuthUserEntity = {
    /**
     * User ID
     */
    id: number;
    /**
     * Username
     */
    username: string;
    /**
     * User email address
     */
    email: string;
    /**
     * Role names assigned to the user
     */
    roles: Array<string>;
    /**
     * Linked Minecraft UUID
     */
    mcUuid: string | null;
    /**
     * Linked SmartRotom user data. Empty object when no SmartRotom account is linked.
     */
    smartRotomUser: SmartRotomUserEntity | null;
};

