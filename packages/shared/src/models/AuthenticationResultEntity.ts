/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntegrationsEntity } from './IntegrationsEntity';
import type { SessionUserEntity } from './SessionUserEntity';
export type AuthenticationResultEntity = {
    /**
     * Session user data
     */
    sessionUser: SessionUserEntity;
    /**
     * User integrations status
     */
    integrations: IntegrationsEntity;
};

