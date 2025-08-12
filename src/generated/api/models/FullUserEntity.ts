/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BoffMediaUserEntity } from './BoffMediaUserEntity';
import type { SmartRotomUserEntity } from './SmartRotomUserEntity';
export type FullUserEntity = {
    /**
     * BoffMedia user data
     */
    boffmedia_users: BoffMediaUserEntity;
    /**
     * SmartRotom user data
     */
    rotom_users: SmartRotomUserEntity | null;
};

