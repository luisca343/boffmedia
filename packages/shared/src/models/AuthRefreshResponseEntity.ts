/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthRefreshUserEntity } from './AuthRefreshUserEntity';
export type AuthRefreshResponseEntity = {
    /**
     * JWT access token
     */
    access_token: string;
    /**
     * JWT refresh token
     */
    refresh_token: string;
    user: AuthRefreshUserEntity;
};

