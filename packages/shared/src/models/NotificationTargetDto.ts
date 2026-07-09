/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationConfigDto } from './NotificationConfigDto';
export type NotificationTargetDto = {
    type: NotificationTargetDto.type;
    config: NotificationConfigDto;
};
export namespace NotificationTargetDto {
    export enum type {
        DISCORD = 'discord',
        WEBHOOK = 'webhook',
        DATABASE = 'database',
    }
}

