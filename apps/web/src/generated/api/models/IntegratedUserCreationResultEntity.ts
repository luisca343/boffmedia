/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BoffMediaUserEntity } from './BoffMediaUserEntity';
import type { SmartRotomUserEntity } from './SmartRotomUserEntity';
import type { StarbankAccountEntity } from './StarbankAccountEntity';
export type IntegratedUserCreationResultEntity = {
    /**
     * Created BoffMedia user
     */
    boffMediaUser: BoffMediaUserEntity;
    /**
     * Created or linked SmartRotom user
     */
    smartRotomUser: SmartRotomUserEntity | null;
    /**
     * Created Starbank accounts
     */
    starbankAccounts: Array<StarbankAccountEntity>;
    /**
     * Whether BoffMedia user was newly created
     */
    isNewBoffMediaUser: boolean;
    /**
     * Whether SmartRotom user was newly created
     */
    isNewSmartRotomUser: boolean;
};

