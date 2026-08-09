/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LauncherSessionUserEntity } from './LauncherSessionUserEntity';
export type DevicePollEntity = {
    status: DevicePollEntity.status;
    /**
     * Bearer para el resto de rutas del launcher. Solo en approved.
     */
    token?: string;
    user?: LauncherSessionUserEntity;
};
export namespace DevicePollEntity {
    export enum status {
        PENDING = 'pending',
        APPROVED = 'approved',
        DENIED = 'denied',
        EXPIRED = 'expired',
    }
}

