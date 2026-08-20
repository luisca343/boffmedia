/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DesktopSessionUserEntity } from './DesktopSessionUserEntity';
export type DevicePollEntity = {
    status: DevicePollEntity.status;
    /**
     * Bearer para el resto de rutas de la app. Solo en approved.
     */
    token?: string;
    user?: DesktopSessionUserEntity;
};
export namespace DevicePollEntity {
    export enum status {
        PENDING = 'pending',
        APPROVED = 'approved',
        DENIED = 'denied',
        EXPIRED = 'expired',
    }
}

