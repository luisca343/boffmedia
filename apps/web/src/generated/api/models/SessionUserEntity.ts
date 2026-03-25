/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionSmartRotomUserEntity } from './SessionSmartRotomUserEntity';
export type SessionUserEntity = {
    /**
     * User ID
     */
    id: number;
    /**
     * User display name
     */
    name: string;
    /**
     * User email
     */
    email: string;
    /**
     * SmartRotom user data
     */
    smartRotomUser: SessionSmartRotomUserEntity | null;
};

