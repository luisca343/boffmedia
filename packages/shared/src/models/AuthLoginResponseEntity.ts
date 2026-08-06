/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthUserEntity } from './AuthUserEntity';
export type AuthLoginResponseEntity = {
    /**
     * JWT access token
     */
    access_token: string;
    /**
     * JWT refresh token
     */
    refresh_token: string;
    user: AuthUserEntity;
};

