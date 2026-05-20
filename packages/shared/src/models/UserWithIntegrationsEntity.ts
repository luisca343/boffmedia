/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BoffMediaUserEntity } from './BoffMediaUserEntity';
import type { SmartRotomUserEntity } from './SmartRotomUserEntity';
import type { StarbankAccountEntity } from './StarbankAccountEntity';
export type UserWithIntegrationsEntity = {
    /**
     * BoffMedia user data
     */
    boffMediaUser: BoffMediaUserEntity;
    /**
     * SmartRotom user data
     */
    smartRotomUser: SmartRotomUserEntity | null;
    /**
     * Starbank accounts
     */
    starbankAccounts: Array<StarbankAccountEntity>;
    /**
     * User roles
     */
    roles: Array<string>;
};

